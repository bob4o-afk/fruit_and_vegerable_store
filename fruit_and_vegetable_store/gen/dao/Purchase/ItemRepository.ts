import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface ItemEntity {
    readonly Id: number;
    Name?: string;
    Price?: number;
    Product?: number;
    AmountInShop?: number;
    Currency?: number;
}

export interface ItemCreateEntity {
    readonly Name?: string;
    readonly Price?: number;
    readonly Product?: number;
    readonly AmountInShop?: number;
    readonly Currency?: number;
}

export interface ItemUpdateEntity extends ItemCreateEntity {
    readonly Id: number;
}

export interface ItemEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Price?: number | number[];
            Product?: number | number[];
            AmountInShop?: number | number[];
            Currency?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Price?: number | number[];
            Product?: number | number[];
            AmountInShop?: number | number[];
            Currency?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Product?: number;
            AmountInShop?: number;
            Currency?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Product?: number;
            AmountInShop?: number;
            Currency?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Product?: number;
            AmountInShop?: number;
            Currency?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Product?: number;
            AmountInShop?: number;
            Currency?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Product?: number;
            AmountInShop?: number;
            Currency?: number;
        };
    },
    $select?: (keyof ItemEntity)[],
    $sort?: string | (keyof ItemEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface ItemEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<ItemEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface ItemUpdateEntityEvent extends ItemEntityEvent {
    readonly previousEntity: ItemEntity;
}

export class ItemRepository {

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
                name: "Price",
                column: "STORE_PRICE",
                type: "DECIMAL",
            },
            {
                name: "Product",
                column: "STORE_PRODUCT",
                type: "INTEGER",
            },
            {
                name: "AmountInShop",
                column: "STORE_AMOUNTINSHOP",
                type: "INTEGER",
            },
            {
                name: "Currency",
                column: "STORE_CURRENCY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(ItemRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: ItemEntityOptions): ItemEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): ItemEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: ItemCreateEntity): number {
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

    public update(entity: ItemUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_STORE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "STORE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: ItemCreateEntity | ItemUpdateEntity): number {
        const id = (entity as ItemUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as ItemUpdateEntity);
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

    public count(options?: ItemEntityOptions): number {
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

    private async triggerEvent(data: ItemEntityEvent | ItemUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("fruit_and_vegetable_store-Purchase-Item", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("fruit_and_vegetable_store-Purchase-Item").send(JSON.stringify(data));
    }
}
