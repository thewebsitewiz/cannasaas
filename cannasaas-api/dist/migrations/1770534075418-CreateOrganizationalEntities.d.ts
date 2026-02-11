import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateOrganizationalEntities1770534075418 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
