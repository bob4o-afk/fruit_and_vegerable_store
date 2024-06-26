import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface NewPurchaseEntity {
    readonly Id: number;
    Name?: string;
    AmountBought?: number;
    Price?: number;
    DiscountPercentage?: number;
    Currency?: number;
    Customer?: number;
    Employee?: number;
    Date?: Date;
}

export interface NewPurchaseCreateEntity {
    readonly Name?: string;
    readonly AmountBought?: number;
    readonly Price?: number;
    readonly DiscountPercentage?: number;
    readonly Currency?: number;
    readonly Customer?: number;
    readonly Employee?: number;
    readonly Date?: Date;
}

export interface NewPurchaseUpdateEntity extends NewPurchaseCreateEntity {
    readonly Id: number;
}

export interface NewPurchaseEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            AmountBought?: number | number[];
            Price?: number | number[];
            DiscountPercentage?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
            Date?: Date | Date[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            AmountBought?: number | number[];
            Price?: number | number[];
            DiscountPercentage?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
            Date?: Date | Date[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            Price?: number;
            DiscountPercentage?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            Price?: number;
            DiscountPercentage?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            Price?: number;
            DiscountPercentage?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            Price?: number;
            DiscountPercentage?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            AmountBought?: number;
            Price?: number;
            DiscountPercentage?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
            Date?: Date;
        };
    },
    $select?: (keyof NewPurchaseEntity)[],
    $sort?: string | (keyof NewPurchaseEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface NewPurchaseEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<NewPurchaseEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface NewPurchaseUpdateEntityEvent extends NewPurchaseEntityEvent {
    readonly previousEntity: NewPurchaseEntity;
}

export class NewPurchaseRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_NEWPURCHASE",
        properties: [
            {
                name: "Id",
                column: "NEWPURCHASE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "NEWPURCHASE_NAME",
                type: "VARCHAR",
            },
            {
                name: "AmountBought",
                column: "NEWPURCHASE_AMOUNTBOUGHT",
                type: "INTEGER",
            },
            {
                name: "Price",
                column: "NEWPURCHASE_PRICE",
                type: "DECIMAL",
            },
            {
                name: "DiscountPercentage",
                column: "NEWPURCHASE_DISCOUNTPERCENTAGE",
                type: "INTEGER",
            },
            {
                name: "Currency",
                column: "NEWPURCHASE_CURRENCY",
                type: "INTEGER",
            },
            {
                name: "Customer",
                column: "NEWPURCHASE_CUSTOMER",
                type: "INTEGER",
            },
            {
                name: "Employee",
                column: "NEWPURCHASE_EMPLOYEE",
                type: "INTEGER",
            },
            {
                name: "Date",
                column: "NEWPURCHASE_DATE",
                type: "DATE",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(NewPurchaseRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: NewPurchaseEntityOptions): NewPurchaseEntity[] {
        return this.dao.list(options).map((e: NewPurchaseEntity) => {
            EntityUtils.setDate(e, "Date");
            return e;
        });
    }

    public findById(id: number): NewPurchaseEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "Date");
        return entity ?? undefined;
    }

    public create(entity: NewPurchaseCreateEntity): number {
        EntityUtils.setLocalDate(entity, "Date");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_NEWPURCHASE",
            entity: entity,
            key: {
                name: "Id",
                column: "NEWPURCHASE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: NewPurchaseUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "Date");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_NEWPURCHASE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "NEWPURCHASE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: NewPurchaseCreateEntity | NewPurchaseUpdateEntity): number {
        const id = (entity as NewPurchaseUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as NewPurchaseUpdateEntity);
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
            table: "CODBEX_NEWPURCHASE",
            entity: entity,
            key: {
                name: "Id",
                column: "NEWPURCHASE_ID",
                value: id
            }
        });
    }

    public count(options?: NewPurchaseEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_NEWPURCHASE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: NewPurchaseEntityEvent | NewPurchaseUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("new_version-NewPurchase-NewPurchase", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("new_version-NewPurchase-NewPurchase").send(JSON.stringify(data));
    }
}
