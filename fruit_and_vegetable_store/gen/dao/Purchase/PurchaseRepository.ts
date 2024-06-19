import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface PurchaseEntity {
    readonly Id: number;
    Name?: string;
    AmountBought?: number;
    DiscountPercentage?: number;
    Price?: number;
    Item?: number;
    Currency?: number;
    Customer?: number;
    Employee?: number;
    Date?: Date;
}

export interface PurchaseCreateEntity {
    readonly Name?: string;
    readonly AmountBought?: number;
    readonly DiscountPercentage?: number;
    readonly Price?: number;
    readonly Currency?: number;
    readonly Customer?: number;
    readonly Employee?: number;
    readonly Date?: Date;
}

export interface PurchaseUpdateEntity extends PurchaseCreateEntity {
    readonly Id: number;
}

export interface PurchaseEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            AmountBought?: number | number[];
            DiscountPercentage?: number | number[];
            Price?: number | number[];
            Item?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
            Date?: Date | Date[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            AmountBought?: number | number[];
            DiscountPercentage?: number | number[];
            Price?: number | number[];
            Item?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
            Date?: Date | Date[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            DiscountPercentage?: number;
            Price?: number;
            Item?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            DiscountPercentage?: number;
            Price?: number;
            Item?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            DiscountPercentage?: number;
            Price?: number;
            Item?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            DiscountPercentage?: number;
            Price?: number;
            Item?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            DiscountPercentage?: number;
            Price?: number;
            Item?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
    },
    $select?: (keyof PurchaseEntity)[],
    $sort?: string | (keyof PurchaseEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface PurchaseEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<PurchaseEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface PurchaseUpdateEntityEvent extends PurchaseEntityEvent {
    readonly previousEntity: PurchaseEntity;
}

export class PurchaseRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_PURCHASE",
        properties: [
            {
                name: "Id",
                column: "PURCHASE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "PURCHASE_NAME",
                type: "VARCHAR",
            },
            {
                name: "AmountBought",
                column: "PURCHASE_AMOUNTBOUGHT",
                type: "INTEGER",
            },
            {
                name: "DiscountPercentage",
                column: "PURCHASE_DISCOUNTPERCENTAGE",
                type: "INTEGER",
            },
            {
                name: "Price",
                column: "PURCHASE_MONEY_GIVEN",
                type: "DECIMAL",
            },
            {
                name: "Item",
                column: "PURCHASE_ITEM",
                type: "INTEGER",
            },
            {
                name: "Currency",
                column: "PURCHASE_CURRENCY",
                type: "INTEGER",
            },
            {
                name: "Customer",
                column: "PURCHASE_CUSTOMER",
                type: "INTEGER",
            },
            {
                name: "Employee",
                column: "PURCHASE_EMPLOYEE",
                type: "INTEGER",
            },
            {
                name: "Date",
                column: "PURCHASE_DATE",
                type: "DATE",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(PurchaseRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: PurchaseEntityOptions): PurchaseEntity[] {
        return this.dao.list(options).map((e: PurchaseEntity) => {
            EntityUtils.setDate(e, "Date");
            return e;
        });
    }

    public findById(id: number): PurchaseEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "Date");
        return entity ?? undefined;
    }

    public create(entity: PurchaseCreateEntity): number {
        EntityUtils.setLocalDate(entity, "Date");
        // @ts-ignore
        (entity as PurchaseEntity).Item = Item["Price"]*Purchase["DiscountPercentage"]/100*Purchase["AmountBought"];
        if (entity.DiscountPercentage === undefined || entity.DiscountPercentage === null) {
            (entity as PurchaseEntity).DiscountPercentage = 0;
        }
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_PURCHASE",
            entity: entity,
            key: {
                name: "Id",
                column: "PURCHASE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: PurchaseUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "Date");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_PURCHASE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "PURCHASE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: PurchaseCreateEntity | PurchaseUpdateEntity): number {
        const id = (entity as PurchaseUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as PurchaseUpdateEntity);
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
            table: "CODBEX_PURCHASE",
            entity: entity,
            key: {
                name: "Id",
                column: "PURCHASE_ID",
                value: id
            }
        });
    }

    public count(options?: PurchaseEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_PURCHASE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: PurchaseEntityEvent | PurchaseUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("fruit_and_vegetable_store-Purchase-Purchase", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("fruit_and_vegetable_store-Purchase-Purchase").send(JSON.stringify(data));
    }
}
