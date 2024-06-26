import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface NewPurchaseEntity {
    readonly Id: number;
    Name?: string;
    Price?: number;
    Currency?: number;
    Customer?: number;
    Employee?: number;
}

export interface NewPurchaseCreateEntity {
    readonly Name?: string;
    readonly Price?: number;
    readonly Currency?: number;
    readonly Customer?: number;
    readonly Employee?: number;
}

export interface NewPurchaseUpdateEntity extends NewPurchaseCreateEntity {
    readonly Id: number;
}

export interface NewPurchaseEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Price?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Price?: number | number[];
            Currency?: number | number[];
            Customer?: number | number[];
            Employee?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Price?: number;
            Currency?: number;
            Customer?: number;
            Employee?: number;
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
                name: "Price",
                column: "NEWPURCHASE_PRICE",
                type: "DECIMAL",
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
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(NewPurchaseRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: NewPurchaseEntityOptions): NewPurchaseEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): NewPurchaseEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: NewPurchaseCreateEntity): number {
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
