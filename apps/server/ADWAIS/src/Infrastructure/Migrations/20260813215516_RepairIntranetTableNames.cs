using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RepairIntranetTableNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_post') THEN
                        ALTER TABLE community_post RENAME TO bulletin_post;
                    END IF;

                    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulletin_post') THEN
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pk_community_post' AND conrelid = 'bulletin_post'::regclass) THEN
                            ALTER TABLE bulletin_post RENAME CONSTRAINT pk_community_post TO pk_bulletin_post;
                        END IF;
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_community_post_users_user_id' AND conrelid = 'bulletin_post'::regclass) THEN
                            ALTER TABLE bulletin_post RENAME CONSTRAINT fk_community_post_users_user_id TO fk_bulletin_post_users_user_id;
                        END IF;
                    END IF;

                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_community_post_created_at') THEN
                        ALTER INDEX ix_community_post_created_at RENAME TO ix_bulletin_post_created_at;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_community_post_user_id') THEN
                        ALTER INDEX ix_community_post_user_id RENAME TO ix_bulletin_post_user_id;
                    END IF;
                END $$;
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'office_event') THEN
                        ALTER TABLE office_event RENAME TO calendar_event;
                    END IF;

                    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_event') THEN
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pk_office_event' AND conrelid = 'calendar_event'::regclass) THEN
                            ALTER TABLE calendar_event RENAME CONSTRAINT pk_office_event TO pk_calendar_event;
                        END IF;
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_office_event_calendar_subscriptions_calendar_subscription_id' AND conrelid = 'calendar_event'::regclass) THEN
                            ALTER TABLE calendar_event RENAME CONSTRAINT fk_office_event_calendar_subscriptions_calendar_subscription_id TO fk_calendar_event_calendar_subscriptions_calendar_subscription;
                        END IF;
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_office_event_users_user_id' AND conrelid = 'calendar_event'::regclass) THEN
                            ALTER TABLE calendar_event RENAME CONSTRAINT fk_office_event_users_user_id TO fk_calendar_event_users_user_id;
                        END IF;
                    END IF;

                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_office_event_calendar_subscription_id') THEN
                        ALTER INDEX ix_office_event_calendar_subscription_id RENAME TO ix_calendar_event_calendar_subscription_id;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_office_event_end_time') THEN
                        ALTER INDEX ix_office_event_end_time RENAME TO ix_calendar_event_end_time;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_office_event_external_uid') THEN
                        ALTER INDEX ix_office_event_external_uid RENAME TO ix_calendar_event_external_uid;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_office_event_start_time') THEN
                        ALTER INDEX ix_office_event_start_time RENAME TO ix_calendar_event_start_time;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_office_event_user_id') THEN
                        ALTER INDEX ix_office_event_user_id RENAME TO ix_calendar_event_user_id;
                    END IF;
                END $$;
                """);

            migrationBuilder.Sql("DROP TABLE IF EXISTS newsletter;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "newsletter",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    title = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_newsletter", x => x.id);
                });

            migrationBuilder.Sql("ALTER INDEX ix_bulletin_post_created_at RENAME TO ix_community_post_created_at;");
            migrationBuilder.Sql("ALTER INDEX ix_bulletin_post_user_id RENAME TO ix_community_post_user_id;");
            migrationBuilder.Sql("ALTER TABLE bulletin_post RENAME CONSTRAINT fk_bulletin_post_users_user_id TO fk_community_post_users_user_id;");
            migrationBuilder.Sql("ALTER TABLE bulletin_post RENAME CONSTRAINT pk_bulletin_post TO pk_community_post;");

            migrationBuilder.RenameTable(
                name: "bulletin_post",
                newName: "community_post");

            migrationBuilder.Sql("ALTER INDEX ix_calendar_event_calendar_subscription_id RENAME TO ix_office_event_calendar_subscription_id;");
            migrationBuilder.Sql("ALTER INDEX ix_calendar_event_end_time RENAME TO ix_office_event_end_time;");
            migrationBuilder.Sql("ALTER INDEX ix_calendar_event_external_uid RENAME TO ix_office_event_external_uid;");
            migrationBuilder.Sql("ALTER INDEX ix_calendar_event_start_time RENAME TO ix_office_event_start_time;");
            migrationBuilder.Sql("ALTER INDEX ix_calendar_event_user_id RENAME TO ix_office_event_user_id;");
            migrationBuilder.Sql("ALTER TABLE calendar_event RENAME CONSTRAINT fk_calendar_event_users_user_id TO fk_office_event_users_user_id;");
            migrationBuilder.Sql("ALTER TABLE calendar_event RENAME CONSTRAINT fk_calendar_event_calendar_subscriptions_calendar_subscription TO fk_office_event_calendar_subscriptions_calendar_subscription_id;");
            migrationBuilder.Sql("ALTER TABLE calendar_event RENAME CONSTRAINT pk_calendar_event TO pk_office_event;");

            migrationBuilder.RenameTable(
                name: "calendar_event",
                newName: "office_event");
        }
    }
}
