import { Lifecycle, Request, ResponseToolkit, RouteOptionsAccess } from "hapi";
import { AllowedRole } from "api/models/Role";
import { Model } from "objection";
import * as Boom from "boom";
import * as Joi from "joi";

/**
 * Tipo de função que trata rotas em um controller
 */
export type PathHandler = (
    params: { [key: string]: any },
    h: ResponseToolkit,
    request: Request
) => Lifecycle.ReturnValue;

interface BaseRoute {
    /**
     * Validação para os parâmetros no caminho do recurso
     */
    paramsValidator?: {
        [name: string]: Joi.AnySchema
    };
    /**
     * Validação para os parâmetros no final da URL
     */
    queryValidator?: {
        [name: string]: Joi.AnySchema
    };
    /**
     * Validação para as informações no corpo da requisição
     */
    payloadValidator?: {
        [name: string]: Joi.AnySchema
    };
    /**
     * Função que responde à requisição
     */
    handler: PathHandler;
}

interface RouteWithAuth extends BaseRoute {
    /**
     * Obriga os usuários a estarem autenticados para acessar essa rota
     * @default true
     */
    authRequired?: true;
    /**
     * Roles permitidos a acessar essa rota
     */
    roles: AllowedRole[];
}

interface RouteWithoutAuth extends BaseRoute {
    authRequired: false;
    roles?: undefined;
}

/**
 * União dos tipos de rota com e sem o parâmetro authRequired
 */
export type Route = RouteWithAuth | RouteWithoutAuth;

export interface RouteMapping {
    [uri: string]: Route;
}

export interface RouteDefinitions {
    GET?: RouteMapping;
    POST?: RouteMapping;
    PUT?: RouteMapping;
    DELETE?: RouteMapping;
}

export default abstract class BaseController {
    /**
     * Classe de modelo usada em buscas
     */
    protected abstract modelClass: typeof Model;

    /**
     * Rotas desse controlador
     */
    public abstract routes: RouteDefinitions;

    /**
     * Retorna um erro de não encontrado para essa entidade
     */
    protected notFound(id: any) {
        return Boom.notFound(`${this.modelClass.name} with id ${id} not found`);
    }

    /**
     * Retorna um erro de não encontrado para outra entidade dentro dessa
     */
    protected otherNotFound(entity: string, id: any, otherId: any) {
        return Boom.notFound(`${entity} with id ${otherId} not found in` +
                             `${this.modelClass.name.toLowerCase()} with id ${id}`);
    }

    /**
     * Cria um relacionamento entre esse objeto (id) e outro (otherId)
     */
    protected async createRelation(id: any, other: string, otherId: any, h: ResponseToolkit) {
        let self = await this.modelClass.query().findById(id);
        if (self) {
            let relation = await self.$relatedQuery(other).relate(otherId);
            return h.response(relation).code(201);
        }
        return this.notFound(id);
    }

    /**
     * Remove o relacionamento entre esse objeto (id) e outro (otherId)
     */
    protected async deleteRelation(id: any, entity: string, relation: string, otherId: any, h: ResponseToolkit) {
        let self = await this.modelClass.query().findById(id);
        if (self) {
            let deleted = await self.$relatedQuery(relation).unrelate().where({ id: otherId });
            if (deleted) {
                return h.response().code(204);
            }
            return this.otherNotFound(entity, id, otherId);
        }
        return this.notFound(id);
    }

    /**
     * Cria um validador simples com propriedades obrigatórias do tipo number
     */
    protected multiIdValidator(...args: string[]) {
        let validator: { [key: string]: Joi.NumberSchema } = {};
        for (let arg of args) {
            validator[arg] = Joi.number().required().example(1);
        }
        console.log(validator);
        return validator;
    }

    /**
     * Especialização de multiIdValidator para ID simples
     */
    protected idValidator(name?: string) {
        return this.multiIdValidator(name || "id");
    }
}