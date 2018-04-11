import BaseController, { RouteDefinitions } from "api/controllers/BaseController";
import { AllowedRole, EVERYONE } from "api/models/Role";
import { DecodedToken, AuthData } from "api/token";
import NullModel from "api/models/NullModel";
import User from "api/models/User";
import * as JWT from "jsonwebtoken";
import * as assert from "assert";
import * as bcrypt from "bcrypt";
import * as Boom from "boom";
import * as Joi from "joi";

export default class AuthController extends BaseController {
    protected modelClass = NullModel;

    private authValidator = {
        username: Joi.string().required().example("admin"),
        password: Joi.string().min(6).max(72).required().example("admin123")
    };

    public routes: RouteDefinitions = {
        GET: {
            "/auth": {
                roles: EVERYONE,
                handler: async ({}, h, request) => {
                    return request.auth.credentials;
                }
            }
        },
        POST: {
            "/auth": {
                authRequired: false,
                payloadValidator: this.authValidator,
                handler: async ({ username, password }, h, request) => {
                    // Checa a validez da chave secreta
                    let key = process.env.SECRET_KEY;
                    assert(key && key.length > 32, "A chave secreta do JWT deve conter pelo menos 32 caracteres");
                    // Busca o usuário e checa suas credenciais
                    let user = await User.query().eager("role").findOne({ username });
                    if (user && user.role && await bcrypt.compare(password, user.password)) {
                        // Cria os dados da JWT
                        let payload: DecodedToken = {
                            uid: user.id,
                            role: user.role.id as AllowedRole
                        };
                        // Gera a nova token
                        let token = JWT.sign(payload, key!, { expiresIn: "30d" });
                        // Retorna a token e os dados do usuário
                        return {
                            username: user.username,
                            fullname: user.fullname,
                            role: user.role.name,
                            id: user.id,
                            token
                        } as AuthData;
                    }
                    // Recusa credenciais inválidos
                    return Boom.unauthorized("Incorrect username or password");
                }
            }
        }
    };
}
