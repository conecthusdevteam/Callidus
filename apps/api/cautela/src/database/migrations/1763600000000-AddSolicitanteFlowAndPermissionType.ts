import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddSolicitanteFlowAndPermissionType1763600000000 implements MigrationInterface {
  name = 'AddSolicitanteFlowAndPermissionType1763600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      new TableColumn({
        default: "'ENTRADA_UNICA'",
        length: '30',
        name: 'tipoPermissao',
        type: 'nvarchar',
      }),
      new TableColumn({
        default: "'SOLICITADA'",
        length: '40',
        name: 'etapaFluxo',
        type: 'nvarchar',
      }),
      new TableColumn({
        isNullable: true,
        name: 'entradaValidadaEm',
        type: 'datetime2',
      }),
      new TableColumn({
        isNullable: true,
        name: 'entradaValidadaPorId',
        type: 'uniqueidentifier',
      }),
      new TableColumn({
        isNullable: true,
        name: 'tipoPermissaoAlteradoEm',
        type: 'datetime2',
      }),
      new TableColumn({
        isNullable: true,
        name: 'tipoPermissaoAlteradoPorId',
        type: 'uniqueidentifier',
      }),
      new TableColumn({
        isNullable: true,
        name: 'visualizadoSolicitanteEm',
        type: 'datetime2',
      }),
      new TableColumn({
        isNullable: true,
        name: 'visualizadoGestorEm',
        type: 'datetime2',
      }),
      new TableColumn({
        isNullable: true,
        name: 'visualizadoPortariaEm',
        type: 'datetime2',
      }),
    ];

    for (const column of columns) {
      if (!(await queryRunner.hasColumn('cautelas', column.name))) {
        await queryRunner.addColumn('cautelas', column);
      }
    }

    if (await queryRunner.hasColumn('cautelas', 'retornoItem')) {
      await queryRunner.dropColumn('cautelas', 'retornoItem');
    }

    if (await queryRunner.hasColumn('cautelas', 'validade')) {
      await queryRunner.dropColumn('cautelas', 'validade');
    }

    await queryRunner.query(
      `UPDATE cautelas SET tipoPermissao = 'ENTRADA_UNICA' WHERE tipoPermissao IS NULL`,
    );
    await queryRunner.query(
      `UPDATE cautelas SET etapaFluxo = CASE
        WHEN status = 'ENCERRADA' THEN 'ENCERRADA_PELA_PORTARIA'
        WHEN status = 'REPROVADA' THEN 'REPROVADA'
        WHEN status = 'APROVADA' AND saidaAutorizadaEm IS NOT NULL THEN 'SAIDA_AUTORIZADA_PELO_GESTOR'
        WHEN status = 'APROVADA' THEN 'VALIDADA_PELA_PORTARIA'
        ELSE 'SOLICITADA'
      END`,
    );
    await queryRunner.query(
      `UPDATE cautelas SET entradaValidadaEm = aprovadoEm WHERE status IN ('APROVADA', 'ENCERRADA') AND entradaValidadaEm IS NULL`,
    );

    const table = await queryRunner.getTable('cautelas');
    const foreignKeys = [
      new TableForeignKey({
        columnNames: ['entradaValidadaPorId'],
        name: 'FK_cautelas_entradaValidadaPorId_users',
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
      new TableForeignKey({
        columnNames: ['tipoPermissaoAlteradoPorId'],
        name: 'FK_cautelas_tipoPermissaoAlteradoPorId_users',
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    ].filter(
      (foreignKey) =>
        !table?.foreignKeys.some(
          (existing) => existing.name === foreignKey.name,
        ),
    );

    if (foreignKeys.length > 0) {
      await queryRunner.createForeignKeys('cautelas', foreignKeys);
    }

    if (
      !table?.indices.some(
        (tableIndex) => tableIndex.name === 'IDX_cautelas_etapaFluxo',
      )
    ) {
      await queryRunner.createIndex(
        'cautelas',
        new TableIndex({
          columnNames: ['etapaFluxo'],
          name: 'IDX_cautelas_etapaFluxo',
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('cautelas');

    for (const foreignKeyName of [
      'FK_cautelas_entradaValidadaPorId_users',
      'FK_cautelas_tipoPermissaoAlteradoPorId_users',
    ]) {
      const foreignKey = table?.foreignKeys.find(
        (existing) => existing.name === foreignKeyName,
      );

      if (foreignKey) {
        await queryRunner.dropForeignKey('cautelas', foreignKey);
      }
    }

    const index = table?.indices.find(
      (tableIndex) => tableIndex.name === 'IDX_cautelas_etapaFluxo',
    );

    if (index) {
      await queryRunner.dropIndex('cautelas', index);
    }

    for (const columnName of [
      'visualizadoPortariaEm',
      'visualizadoGestorEm',
      'visualizadoSolicitanteEm',
      'tipoPermissaoAlteradoPorId',
      'tipoPermissaoAlteradoEm',
      'entradaValidadaPorId',
      'entradaValidadaEm',
      'etapaFluxo',
      'tipoPermissao',
    ]) {
      if (await queryRunner.hasColumn('cautelas', columnName)) {
        await queryRunner.dropColumn('cautelas', columnName);
      }
    }

    if (!(await queryRunner.hasColumn('cautelas', 'retornoItem'))) {
      await queryRunner.addColumn(
        'cautelas',
        new TableColumn({ default: 1, name: 'retornoItem', type: 'bit' }),
      );
    }

    if (!(await queryRunner.hasColumn('cautelas', 'validade'))) {
      await queryRunner.addColumn(
        'cautelas',
        new TableColumn({
          isNullable: true,
          name: 'validade',
          type: 'datetime2',
        }),
      );
    }
  }
}
