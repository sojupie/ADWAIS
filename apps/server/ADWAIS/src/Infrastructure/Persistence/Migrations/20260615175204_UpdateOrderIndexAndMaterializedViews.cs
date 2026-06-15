using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOrderIndexAndMaterializedViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_orders_tenant_litium",
                table: "orders");

            migrationBuilder.CreateIndex(
                name: "ix_orders_tenant_id_created_date_order_state",
                table: "orders",
                columns: new[] { "tenant_id", "created_date", "order_state" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_orders_tenant_id_created_date_order_state",
                table: "orders");

            migrationBuilder.CreateIndex(
                name: "uq_orders_tenant_litium",
                table: "orders",
                columns: new[] { "tenant_id", "litium_order_id" },
                unique: true);
        }
    }
}
