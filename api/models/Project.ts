import { Model, RelationMappings, Pojo } from "objection";
import { ProjectStub, ProjectStatus } from "api/stubs";
import Version from "api/models/Version";
import Task from "api/models/Task";
import User from "api/models/User";
import Tag from "api/models/Tag";
import * as moment from "moment";
import * as Joi from "joi";

export default class Project extends Model implements ProjectStub {
    public static defaultEagerAlgorithm = Model.JoinEagerAlgorithm;
    public static tableName = "project";

    public id!: number;
    public name!: string;
    public due_date!: Date;
    public status!: string;
    public manager_id?: number;
    public manager?: User;
    public versions?: Version;
    public tasks?: Task[];
    public users?: User[];
    public tags?: Tag[];
    public created_at!: Date;
    public updated_at!: Date;

    public static validStatuses = Object.values(ProjectStatus);

    public static userValidator = {
        id: Joi.number().required().example(1)
    };

    public static validator = {
        id: Joi.forbidden(),
        name: Joi.string().required().example("Projeto Exemplo"),
        due_date: Joi.date().required().example("2018-12-31"),
        status: Joi.string().only(Project.validStatuses).required(),
        manager_id: Joi.number().optional().example(1),
        created_at: Joi.date().optional().example("2018-03-01"),
        users: Joi.array().items(Project.userValidator).optional()
    };

    public static get relationMappings(): RelationMappings {
        return {
            manager: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: "project.manager_id",
                    to: "user.id"
                }
            },
            versions: {
                relation: Model.HasManyRelation,
                modelClass: Version,
                join: {
                    from: "project.id",
                    to: "version.project_id"
                }
            },
            tasks: {
                relation: Model.HasManyRelation,
                modelClass: Task,
                join: {
                    from: "project.id",
                    to: "task.project_id"
                }
            },
            users: {
                relation: Model.ManyToManyRelation,
                modelClass: User,
                join: {
                    from: "project.id",
                    through: {
                        from: "project_user.project_id",
                        to: "project_user.user_id"
                    },
                    to: "user.id"
                }
            },
            tags: {
                relation: Model.ManyToManyRelation,
                modelClass: Tag,
                join: {
                    from: "project.id",
                    through: {
                        from: "tag_project.project_id",
                        to: "tag_project.tag_id"
                    },
                    to: "tag.id"
                }
            }
        };
    }

    public $formatJson(json: Pojo) {
        // Remove o ID de join do manager
        delete json.manager_id;
        return super.$formatJson(json);
    }
}
