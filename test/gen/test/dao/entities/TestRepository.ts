import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface TestEntity {
    readonly Id: number;
    Name?: string;
    Num?: number;
    City?: number;
    Country?: number;
    TestStatus?: number;
}

export interface TestCreateEntity {
    readonly Name?: string;
    readonly Num?: number;
    readonly City?: number;
    readonly Country?: number;
    readonly TestStatus?: number;
}

export interface TestUpdateEntity extends TestCreateEntity {
    readonly Id: number;
}

export interface TestEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Num?: number | number[];
            City?: number | number[];
            Country?: number | number[];
            TestStatus?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Num?: number | number[];
            City?: number | number[];
            Country?: number | number[];
            TestStatus?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Num?: number;
            City?: number;
            Country?: number;
            TestStatus?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Num?: number;
            City?: number;
            Country?: number;
            TestStatus?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Num?: number;
            City?: number;
            Country?: number;
            TestStatus?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Num?: number;
            City?: number;
            Country?: number;
            TestStatus?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Num?: number;
            City?: number;
            Country?: number;
            TestStatus?: number;
        };
    },
    $select?: (keyof TestEntity)[],
    $sort?: string | (keyof TestEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface TestEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<TestEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface TestUpdateEntityEvent extends TestEntityEvent {
    readonly previousEntity: TestEntity;
}

export class TestRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_TEST",
        properties: [
            {
                name: "Id",
                column: "TEST_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "TEST_NAME",
                type: "VARCHAR",
            },
            {
                name: "Num",
                column: "TEST_NUM",
                type: "DECIMAL",
            },
            {
                name: "City",
                column: "TEST_CITY",
                type: "INTEGER",
            },
            {
                name: "Country",
                column: "TEST_COUNTRY",
                type: "INTEGER",
            },
            {
                name: "TestStatus",
                column: "TEST_TESTSTATUS",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(TestRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: TestEntityOptions): TestEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): TestEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: TestCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_TEST",
            entity: entity,
            key: {
                name: "Id",
                column: "TEST_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: TestUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_TEST",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "TEST_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: TestCreateEntity | TestUpdateEntity): number {
        const id = (entity as TestUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as TestUpdateEntity);
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
            table: "CODBEX_TEST",
            entity: entity,
            key: {
                name: "Id",
                column: "TEST_ID",
                value: id
            }
        });
    }

    public count(options?: TestEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_TEST"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: TestEntityEvent | TestUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("test-entities-Test", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("test-entities-Test").send(JSON.stringify(data));
    }
}
