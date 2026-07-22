using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUptimeMonitorType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "type",
                table: "monitor",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "HTTP");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "type",
                table: "monitor");
        }
    }
}
