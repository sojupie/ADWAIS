using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BaselineSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "global_config",
                columns: table => new
                {
                    last_polled = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    enabled = table.Column<bool>(type: "boolean", nullable: false),
                    litium_rate_limit = table.Column<int>(type: "integer", nullable: false),
                    uptime_robot_rate_limit = table.Column<int>(type: "integer", nullable: false),
                    latency_degraded_floor = table.Column<int>(type: "integer", nullable: true),
                    monitors_count = table.Column<int>(type: "integer", nullable: false),
                    monitors_limit = table.Column<int>(type: "integer", nullable: false),
                    active_subscription = table.Column<string>(type: "text", nullable: true),
                    uptime_robot_api_key = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                });

            migrationBuilder.CreateTable(
                name: "tenant",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    name = table.Column<string>(type: "text", nullable: false),
                    litium_base_url = table.Column<string>(type: "text", nullable: false),
                    service_account_token = table.Column<string>(type: "text", nullable: false),
                    order_count = table.Column<int>(type: "integer", nullable: false),
                    currently_fetching = table.Column<bool>(type: "boolean", nullable: false),
                    fetched_from = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    fetched_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_polled = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ping_reachable = table.Column<bool>(type: "boolean", nullable: true),
                    order_fetching_enabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tenant", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    name = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "monitor",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    url = table.Column<string>(type: "text", nullable: false),
                    uptime_sla = table.Column<double>(type: "double precision", nullable: true),
                    uptime_monitor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    creation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_monitor", x => x.id);
                    table.ForeignKey(
                        name: "fk_monitor_tenant_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenant",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_state = table.Column<string>(type: "text", nullable: false),
                    order_type = table.Column<string>(type: "text", nullable: false),
                    litium_order_id = table.Column<string>(type: "text", nullable: false),
                    created_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_update = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    total_value_inc_vat = table.Column<int>(type: "integer", nullable: false),
                    total_value_exc_vat = table.Column<int>(type: "integer", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.ForeignKey(
                        name: "fk_orders_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenant",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "response_time",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    monitor_id = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    average = table.Column<double>(type: "double precision", nullable: true),
                    lowest = table.Column<double>(type: "double precision", nullable: true),
                    highest = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_response_time", x => x.id);
                    table.ForeignKey(
                        name: "fk_response_time_monitor_monitor_id",
                        column: x => x.monitor_id,
                        principalTable: "monitor",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_monitor_tenant_id",
                table: "monitor",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "idx_orders_composite_dash",
                table: "orders",
                columns: new[] { "created_date", "tenant_id" })
                .Annotation("Npgsql:IndexInclude", new[] { "total_value_inc_vat" });

            migrationBuilder.CreateIndex(
                name: "idx_orders_tenant_isolated",
                table: "orders",
                columns: new[] { "tenant_id", "created_date" })
                .Annotation("Npgsql:IndexInclude", new[] { "total_value_inc_vat" });

            migrationBuilder.CreateIndex(
                name: "idx_orders_value_dist",
                table: "orders",
                columns: new[] { "tenant_id", "total_value_inc_vat" });

            migrationBuilder.CreateIndex(
                name: "uq_orders_tenant_litium",
                table: "orders",
                columns: new[] { "tenant_id", "litium_order_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_response_time_monitor_id",
                table: "response_time",
                column: "monitor_id");

            migrationBuilder.Sql(
                "CREATE MATERIALIZED VIEW v_mat_financial_daily_tenant_rollup AS\nSELECT date(orders.created_date)       AS created_date,\n       orders.tenant_id,\n       count(orders.id)                AS volume,\n       sum(orders.total_value_inc_vat) AS revenue\nFROM orders\nWHERE orders.created_date >= (CURRENT_DATE - '730 days'::interval)\nGROUP BY date(orders.created_date), orders.tenant_id;" +
                "CREATE MATERIALIZED VIEW v_mat_financial_daily_global_rollup AS\nSELECT created_date,\n       sum(volume)  AS global_volume,\n       sum(revenue) AS global_revenue\nFROM v_mat_financial_daily_tenant_rollup\nGROUP BY created_date;" +
                "CREATE MATERIALIZED VIEW v_mat_daily_latency_monitor_rollup AS\nSELECT date(date) AS date,\n       monitor_id,\n       avg(average) AS average,\n       min(lowest)  AS lowest,\n       max(highest) AS highest\nFROM response_time\nGROUP BY date(date), monitor_id;" +
                "CREATE MATERIALIZED VIEW v_mat_daily_latency_tenant_rollup AS\nSELECT date(rt.date) AS date,\n       m.tenant_id,\n       avg(rt.average) AS average,\n       min(rt.lowest)  AS lowest,\n       max(rt.highest) AS highest\nFROM response_time rt\n         JOIN monitor m ON rt.monitor_id = m.id\nGROUP BY date(rt.date), m.tenant_id;\n" +
                "CREATE MATERIALIZED VIEW v_mat_daily_latency_global_rollup AS\nSELECT date(date) AS date,\n       avg(average) AS average,\n       min(lowest)  AS lowest,\n       max(highest) AS highest\nFROM response_time\nGROUP BY date(date);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "global_config");

            migrationBuilder.DropTable(
                name: "orders");

            migrationBuilder.DropTable(
                name: "response_time");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "monitor");

            migrationBuilder.DropTable(
                name: "tenant");
        }
    }
}
