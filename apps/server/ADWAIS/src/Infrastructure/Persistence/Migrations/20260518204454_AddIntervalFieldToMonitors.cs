using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIntervalFieldToMonitors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "update_interval",
                table: "monitor",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "update_interval",
                table: "monitor");
        }
    }
}


