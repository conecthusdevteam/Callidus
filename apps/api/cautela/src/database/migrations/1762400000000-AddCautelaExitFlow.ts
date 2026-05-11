import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddCautelaExitFlow1762400000000 implements MigrationInterface {
  name = 'AddCautelaExitFlow1762400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      new TableColumn({ length: '150', name: 'empresa', type: 'nvarchar', isNullable: true }),
      new TableColumn({
        length: '30',
        name: 'documentoProprietario',
        type: 'nvarchar',
        isNullable: true,
      }),
      new TableColumn({ name: 'aprovadoEm', type: 'datetime2', isNullable: true }),
      new TableColumn({ name: 'rejeitadoEm', type: 'datetime2', isNullable: true }),
      new TableColumn({ name: 'saidaAutorizadaEm', type: 'datetime2', isNullable: true }),
      new TableColumn({
        name: 'saidaAutorizadaPorId',
        type: 'uniqueidentifier',
        isNullable: true,
      }),
      new TableColumn({ name: 'encerradoEm', type: 'datetime2', isNullable: true }),
      new TableColumn({
        name: 'encerradoPorId',
        type: 'uniqueidentifier',
        isNullable: true,
      }),
    ];

    for (const column of columns) {
      if (!(await queryRunner.hasColumn('cautelas', column.name))) {
        await queryRunner.addColumn('cautelas', column);
      }
    }

    await queryRunner.query(
      `UPDATE cautelas SET aprovadoEm = respondidoEm WHERE status = 'APROVADA' AND aprovadoEm IS NULL`,
    );
    await queryRunner.query(
      `UPDATE cautelas SET rejeitadoEm = respondidoEm WHERE status = 'REPROVADA' AND rejeitadoEm IS NULL`,
    );

    const table = await queryRunner.getTable('cautelas');
    const existingForeignKeyNames = new Set(
      table?.foreignKeys.map((foreignKey) => foreignKey.name) ?? [],
    );

    const hasForeignKeyForColumn = (columnName: string) =>
      table?.foreignKeys.some((foreignKey) => foreignKey.columnNames.includes(columnName));

    const foreignKeys = [
      new TableForeignKey({
        columnNames: ['saidaAutorizadaPorId'],
        name: 'FK_cautelas_saidaAutorizadaPorId_users',
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
      new TableForeignKey({
        columnNames: ['encerradoPorId'],
        name: 'FK_cautelas_encerradoPorId_users',
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    ].filter(
      (foreignKey) =>
        !existingForeignKeyNames.has(foreignKey.name) &&
        !hasForeignKeyForColumn(foreignKey.columnNames[0]),
    );

    if (foreignKeys.length > 0) {
      await queryRunner.createForeignKeys('cautelas', foreignKeys);
    }

    if (!table?.indices.some((tableIndex) => tableIndex.name === 'IDX_cautelas_atualizadoEm')) {
      await queryRunner.createIndex(
        'cautelas',
        new TableIndex({
          columnNames: ['atualizadoEm'],
          name: 'IDX_cautelas_atualizadoEm',
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('cautelas');

    for (const foreignKeyName of [
      'FK_cautelas_saidaAutorizadaPorId_users',
      'FK_cautelas_encerradoPorId_users',
    ]) {
      const foreignKey = table?.foreignKeys.find((key) => key.name === foreignKeyName);

      if (foreignKey) {
        await queryRunner.dropForeignKey('cautelas', foreignKey);
      }
    }

    const index = table?.indices.find((tableIndex) => tableIndex.name === 'IDX_cautelas_atualizadoEm');

    if (index) {
      await queryRunner.dropIndex('cautelas', index);
    }

    for (const columnName of [
      'encerradoPorId',
      'encerradoEm',
      'saidaAutorizadaPorId',
      'saidaAutorizadaEm',
      'rejeitadoEm',
      'aprovadoEm',
      'documentoProprietario',
      'empresa',
    ]) {
      if (await queryRunner.hasColumn('cautelas', columnName)) {
        await queryRunner.dropColumn('cautelas', columnName);
      }
    }
  }
}
