import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1781115891415 implements MigrationInterface {
    name = 'InitialMigration1781115891415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sectors" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_923fdda0dc12f59add7b3a1782f" DEFAULT NEWSEQUENTIALID(), "numeroSetor" int NOT NULL, "nome" nvarchar(150) NOT NULL, "gestorId" uniqueidentifier NOT NULL, "ativo" bit NOT NULL CONSTRAINT "DF_2b0b073ed5db0ff39f5336882a1" DEFAULT 1, "criadoEm" datetime2 NOT NULL CONSTRAINT "DF_336a56e80e181876cb8cbfa8930" DEFAULT getdate(), "atualizadoEm" datetime2 NOT NULL CONSTRAINT "DF_84ef213b17cb8e2929e8efb1483" DEFAULT getdate(), CONSTRAINT "UQ_47aa9216179f877663c4e448109" UNIQUE ("numeroSetor"), CONSTRAINT "PK_923fdda0dc12f59add7b3a1782f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cautela_items" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_9a849f659298e0e768448012c77" DEFAULT NEWSEQUENTIALID(), "cautelaId" uniqueidentifier NOT NULL, "nomeItem" nvarchar(150) NOT NULL, "quantidade" int NOT NULL, "criadoEm" datetime2 NOT NULL CONSTRAINT "DF_805ccda07d7257544e471d1e86c" DEFAULT getdate(), "atualizadoEm" datetime2 NOT NULL CONSTRAINT "DF_7addd6fc54f79ec11d2fc536501" DEFAULT getdate(), CONSTRAINT "PK_9a849f659298e0e768448012c77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cautelas" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_823d5e4867ca23b766db476225a" DEFAULT NEWSEQUENTIALID(), "customId" nvarchar(50) NOT NULL, "tipo" nvarchar(255) CONSTRAINT CHK_43539fda0802380cc6c339a3f0_ENUM CHECK(tipo IN ('ACESSO','ALIMENTO','EQUIPAMENTO')) NOT NULL, "tipoPermissao" nvarchar(255) CONSTRAINT CHK_05ca4eef03f649fb1a046f4f5f_ENUM CHECK(tipoPermissao IN ('ENTRADA_UNICA','LIVRE_TRANSITO')) NOT NULL CONSTRAINT "DF_a6f825003834ca4c68555ea59d4" DEFAULT 'ENTRADA_UNICA', "status" nvarchar(255) CONSTRAINT CHK_a02443aa6a7bfe204584fdaebd_ENUM CHECK(status IN ('APROVADA','ENCERRADA','EM_ANALISE','REPROVADA')) NOT NULL, "etapaFluxo" nvarchar(255) CONSTRAINT CHK_f217d4af8083a3657d1ba92afe_ENUM CHECK(etapaFluxo IN ('SOLICITADA','APROVADA_PELO_GESTOR','VALIDADA_PELA_PORTARIA','SAIDA_AUTORIZADA_PELO_GESTOR','ENCERRADA_PELA_PORTARIA','REPROVADA')) NOT NULL CONSTRAINT "DF_1024b7d192ca60d148a36c9b0d7" DEFAULT 'SOLICITADA', "solicitadoPorId" uniqueidentifier NOT NULL, "gestorId" uniqueidentifier NOT NULL, "setorId" uniqueidentifier NOT NULL, "proprietarioNome" nvarchar(150) NOT NULL, "proprietarioEmail" nvarchar(150) NOT NULL, "empresa" nvarchar(150), "documentoProprietario" nvarchar(30), "justificativaRejeicao" nvarchar(max), "respondidoEm" datetime2, "aprovadoEm" datetime2, "rejeitadoEm" datetime2, "saidaAutorizadaEm" datetime2, "saidaAutorizadaPorId" uniqueidentifier, "entradaValidadaEm" datetime2, "entradaValidadaPorId" uniqueidentifier, "tipoPermissaoAlteradoEm" datetime2, "tipoPermissaoAlteradoPorId" uniqueidentifier, "visualizadoSolicitanteEm" datetime2, "visualizadoGestorEm" datetime2, "visualizadoPortariaEm" datetime2, "encerradoEm" datetime2, "encerradoPorId" uniqueidentifier, "criadoEm" datetime2 NOT NULL CONSTRAINT "DF_716b425d05574e59ffeee446215" DEFAULT getdate(), "atualizadoEm" datetime2 NOT NULL CONSTRAINT "DF_ac84cdd3e1d4fb62898c47112a9" DEFAULT getdate(), CONSTRAINT "UQ_866739c5805b02c8148ca924d44" UNIQUE ("customId"), CONSTRAINT "PK_823d5e4867ca23b766db476225a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a3ffb1c0c8416b9fc6f907b7433" DEFAULT NEWSEQUENTIALID(), "nome" nvarchar(150) NOT NULL, "email" nvarchar(150) NOT NULL, "senhaHash" nvarchar(255) NOT NULL, "papel" nvarchar(255) CONSTRAINT CHK_e8f3e3cc198f0376be4bfb1222_ENUM CHECK(papel IN ('ADMIN','GESTOR','PORTARIA','SOLICITANTE')) NOT NULL, "ativo" bit NOT NULL CONSTRAINT "DF_12dd6c1770dc2a2e510b22774e5" DEFAULT 1, "tokenVersion" int NOT NULL CONSTRAINT "DF_5a79c8cd826637259b39d32466f" DEFAULT 0, "refreshTokenHash" varchar(255), "refreshTokenExpiresAt" datetime2, "criadoEm" datetime2 NOT NULL CONSTRAINT "DF_a43df8761cf5300ae456c437b4b" DEFAULT getdate(), "atualizadoEm" datetime2 NOT NULL CONSTRAINT "DF_87a951696180dd8799bdb4c61e7" DEFAULT getdate(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cautela_events" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_649efa6932238321de7a70cd871" DEFAULT NEWSEQUENTIALID(), "cautelaId" uniqueidentifier NOT NULL, "acao" nvarchar(30) NOT NULL, "descricao" nvarchar(max) NOT NULL, "feitoPorId" uniqueidentifier NOT NULL, "timestamp" datetime2 NOT NULL CONSTRAINT "DF_100cc983355a5f4f5c73f53e5ba" DEFAULT getdate(), CONSTRAINT "PK_649efa6932238321de7a70cd871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sectors" ADD CONSTRAINT "FK_8f8f9f592ad6f42efad42fa9ee9" FOREIGN KEY ("gestorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautela_items" ADD CONSTRAINT "FK_0c54651063e3e2e2ad364ae5e29" FOREIGN KEY ("cautelaId") REFERENCES "cautelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_f102804f3f4fad87753065db2b3" FOREIGN KEY ("solicitadoPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_5420e45e74a78003050e498a21f" FOREIGN KEY ("gestorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_55e7c48fe186c8da65fa6550a20" FOREIGN KEY ("saidaAutorizadaPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_035ac4f64b3e0d5e3d5e0932e84" FOREIGN KEY ("entradaValidadaPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_b108942bbe9a8ebbb1881819ee7" FOREIGN KEY ("tipoPermissaoAlteradoPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_570c56032b9a770f3f71f3ad20f" FOREIGN KEY ("encerradoPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautelas" ADD CONSTRAINT "FK_75964e597ec4ef21f2e98d7500e" FOREIGN KEY ("setorId") REFERENCES "sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautela_events" ADD CONSTRAINT "FK_fea481e65bbb0869c849db79118" FOREIGN KEY ("cautelaId") REFERENCES "cautelas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cautela_events" ADD CONSTRAINT "FK_307071df4cf394620cc2a002abb" FOREIGN KEY ("feitoPorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cautela_events" DROP CONSTRAINT "FK_307071df4cf394620cc2a002abb"`);
        await queryRunner.query(`ALTER TABLE "cautela_events" DROP CONSTRAINT "FK_fea481e65bbb0869c849db79118"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_75964e597ec4ef21f2e98d7500e"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_570c56032b9a770f3f71f3ad20f"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_b108942bbe9a8ebbb1881819ee7"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_035ac4f64b3e0d5e3d5e0932e84"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_55e7c48fe186c8da65fa6550a20"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_5420e45e74a78003050e498a21f"`);
        await queryRunner.query(`ALTER TABLE "cautelas" DROP CONSTRAINT "FK_f102804f3f4fad87753065db2b3"`);
        await queryRunner.query(`ALTER TABLE "cautela_items" DROP CONSTRAINT "FK_0c54651063e3e2e2ad364ae5e29"`);
        await queryRunner.query(`ALTER TABLE "sectors" DROP CONSTRAINT "FK_8f8f9f592ad6f42efad42fa9ee9"`);
        await queryRunner.query(`DROP TABLE "cautela_events"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "cautelas"`);
        await queryRunner.query(`DROP TABLE "cautela_items"`);
        await queryRunner.query(`DROP TABLE "sectors"`);
    }

}
