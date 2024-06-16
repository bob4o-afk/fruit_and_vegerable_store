import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface StoreEntity {
    readonly Id: number;
    Name?: string;
    Content?: string;
}

export interface StoreCreateEntity {
    readonly Name?: string;
    readonly Content?: string;
}

export interface StoreUpdateEntity extends StoreCreateEntity {
    readonly Id: number;
}

export interface StoreEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Content?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Content?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Content?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Content?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Content?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Content?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Content?: string;
        };
    },
    $select?: (keyof StoreEntity)[],
    $sort?: string | (keyof StoreEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface StoreEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<StoreEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class StoreRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_STORE",
        properties: [
            {
                name: "Id",
                column: "STORE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "STORE_NAME",
                type: "VARCHAR",
            },
            {
                name: "Content",
                column: "STORE_CONTENT",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource?: string) {
        this.dao = daoApi.create(StoreRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: StoreEntityOptions): StoreEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): StoreEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: StoreCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_STORE",
            entity: entity,
            key: {
                name: "Id",
                column: "STORE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: StoreUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_STORE",
            entity: entity,
            key: {
                name: "Id",
                column: "STORE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: StoreCreateEntity | StoreUpdateEntity): number {
        const id = (entity as StoreUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as StoreUpdateEntity);
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
            table: "CODBEX_STORE",
            entity: entity,
            key: {
                name: "Id",
                column: "STORE_ID",
                value: id
            }
        });
    }

    public count(options?: StoreEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_STORE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: StoreEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("fruit_and_vegetable_store-entities-Store", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("fruit_and_vegetable_store-entities-Store").send(JSON.stringify(data));
    }
}
