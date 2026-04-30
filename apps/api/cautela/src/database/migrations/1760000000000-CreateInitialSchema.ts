import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInitialSchema1760000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            default: 'NEWSEQUENTIALID()',
            isPrimary: true,
            name: 'id',
            type: 'uniqueidentifier',
          },
          { length: '150', name: 'nome', type: 'nvarchar' },
          { length: '150', name: 'email', type: 'nvarchar', isUnique: true },
          { length: '255', name: 'senhaHash', type: 'nvarchar' },
          { length: '30', name: 'papel', type: 'nvarchar' },
          { default: 1, name: 'ativo', type: 'bit' },
          { default: 0, name: 'tokenVersion', type: 'int' },
          {
            isNullable: true,
            length: '255',
            name: 'refreshTokenHash',
            type: 'varchar',
          },
          { isNullable: true, name: 'refreshTokenExpiresAt', type: 'datetime2' },
          { default: 'GETDATE()', name: 'criadoEm', type: 'datetime2' },
          { default: 'GETDATE()', name: 'atualizadoEm', type: 'datetime2' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'sectors',
        columns: [
          {
            default: 'NEWSEQUENTIALID()',
            isPrimary: true,
            name: 'id',
            type: 'uniqueidentifier',
          },
          { name: 'numeroSetor', type: 'int', isUnique: true },
          { length: '150', name: 'nome', type: 'nvarchar' },
          { name: 'gestorId', type: 'uniqueidentifier' },
          { default: 1, name: 'ativo', type: 'bit' },
          { default: 'GETDATE()', name: 'criadoEm', type: 'datetime2' },
          { default: 'GETDATE()', name: 'atualizadoEm', type: 'datetime2' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cautelas',
        columns: [
          {
            default: 'NEWSEQUENTIALID()',
            isPrimary: true,
            name: 'id',
            type: 'uniqueidentifier',
          },
          { length: '30', name: 'tipo', type: 'nvarchar' },
          { length: '30', name: 'status', type: 'nvarchar' },
          { name: 'solicitadoPorId', type: 'uniqueidentifier' },
          { name: 'gestorId', type: 'uniqueidentifier' },
          { name: 'setorId', type: 'uniqueidentifier' },
          { length: '150', name: 'proprietarioNome', type: 'nvarchar' },
          { length: '150', name: 'proprietarioEmail', type: 'nvarchar' },
          { name: 'retornoItem', type: 'bit' },
          { isNullable: true, name: 'validade', type: 'datetime2' },
          { isNullable: true, length: 'MAX', name: 'justificativaRejeicao', type: 'nvarchar' },
          { isNullable: true, name: 'respondidoEm', type: 'datetime2' },
          { default: 'GETDATE()', name: 'criadoEm', type: 'datetime2' },
          { default: 'GETDATE()', name: 'atualizadoEm', type: 'datetime2' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cautela_items',
        columns: [
          {
            default: 'NEWSEQUENTIALID()',
            isPrimary: true,
            name: 'id',
            type: 'uniqueidentifier',
          },
          { name: 'cautelaId', type: 'uniqueidentifier' },
          { length: '150', name: 'nomeItem', type: 'nvarchar' },
          { name: 'quantidade', type: 'int' },
          { default: 'GETDATE()', name: 'criadoEm', type: 'datetime2' },
          { default: 'GETDATE()', name: 'atualizadoEm', type: 'datetime2' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cautela_events',
        columns: [
          {
            default: 'NEWSEQUENTIALID()',
            isPrimary: true,
            name: 'id',
            type: 'uniqueidentifier',
          },
          { name: 'cautelaId', type: 'uniqueidentifier' },
          { length: '30', name: 'acao', type: 'nvarchar' },
          { length: 'MAX', name: 'descricao', type: 'nvarchar' },
          { name: 'feitoPorId', type: 'uniqueidentifier' },
          { default: 'GETDATE()', name: 'timestamp', type: 'datetime2' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('sectors', [
      new TableForeignKey({
        columnNames: ['gestorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    ]);

    await queryRunner.createForeignKeys('cautelas', [
      new TableForeignKey({
        columnNames: ['solicitadoPorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
      new TableForeignKey({
        columnNames: ['gestorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
      new TableForeignKey({
        columnNames: ['setorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sectors',
      }),
    ]);

    await queryRunner.createForeignKeys('cautela_items', [
      new TableForeignKey({
        columnNames: ['cautelaId'],
        onDelete: 'CASCADE',
        referencedColumnNames: ['id'],
        referencedTableName: 'cautelas',
      }),
    ]);

    await queryRunner.createForeignKeys('cautela_events', [
      new TableForeignKey({
        columnNames: ['cautelaId'],
        onDelete: 'CASCADE',
        referencedColumnNames: ['id'],
        referencedTableName: 'cautelas',
      }),
      new TableForeignKey({
        columnNames: ['feitoPorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    ]);

    await queryRunner.createIndices('cautelas', [
      new TableIndex({ columnNames: ['status'], name: 'IDX_cautelas_status' }),
      new TableIndex({ columnNames: ['setorId'], name: 'IDX_cautelas_setorId' }),
      new TableIndex({ columnNames: ['gestorId'], name: 'IDX_cautelas_gestorId' }),
      new TableIndex({
        columnNames: ['solicitadoPorId'],
        name: 'IDX_cautelas_solicitadoPorId',
      }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cautela_events', true, true, true);
    await queryRunner.dropTable('cautela_items', true, true, true);
    await queryRunner.dropTable('cautelas', true, true, true);
    await queryRunner.dropTable('sectors', true, true, true);
    await queryRunner.dropTable('users', true, true, true);
  }
}
