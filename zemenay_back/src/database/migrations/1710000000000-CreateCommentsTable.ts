import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCommentsTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'post_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'author_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'author_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comments',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for better query performance
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENT_POST',
        columnNames: ['post_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENT_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_COMMENT_PARENT',
        columnNames: ['parent_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const table = await queryRunner.getTable('comments');
    if (table) {
      const foreignKeys = table.foreignKeys.filter(
        (fk) =>
          fk.columnNames.indexOf('post_id') !== -1 ||
          fk.columnNames.indexOf('parent_id') !== -1,
      );

      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('comments', fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('comments', 'IDX_COMMENT_POST');
    await queryRunner.dropIndex('comments', 'IDX_COMMENT_STATUS');
    await queryRunner.dropIndex('comments', 'IDX_COMMENT_PARENT');

    // Finally drop the table
    await queryRunner.dropTable('comments');
  }
}
