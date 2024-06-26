import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface NewItemEntity {
    readonly Id: number;
}

export interface NewItemCreateEntity {
}

export interface NewItemUpdateEntity extends NewItemCreateEntity {
    readonly Id: number;
}

export interface NewItemEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
        };
        contains?: {
            Id?: number;
        };
        greaterThan?: {
            Id?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
        };
        lessThan?: {
            Id?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
        };
    },
    $select?: (keyof NewItemEntity)[],
    $sort?: string | (keyof NewItemEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface NewItemEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<NewItemEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface NewItemUpdateEntityEvent extends NewItemEntityEvent {
    readonly previousEntity: NewItemEntity;
}

export class NewItemRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_NEWITEM",
        properties: [
            {
                name: "Id",
                column: "NEWITEM_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(NewItemRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: NewItemEntityOptions): NewItemEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): NewItemEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: NewItemCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_NEWITEM",
            entity: entity,
            key: {
                name: "Id",
                column: "NEWITEM_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: NewItemUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_NEWITEM",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "NEWITEM_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: NewItemCreateEntity | NewItemUpdateEntity): number {
        const id = (entity as NewItemUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as NewItemUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "CODBEX_NEWITEM",
            entity: entity,
            key: {
                name: "Id",
                column: "NEWITEM_ID",
                value: id
            }
        });
    }

    public count(options?: NewItemEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_NEWITEM"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: NewItemEntityEvent | NewItemUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("new_version-entities-NewItem", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("new_version-entities-NewItem").send(JSON.stringify(data));
    }
}
