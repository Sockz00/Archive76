using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Archive76.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "catalogue_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    item_kind = table.Column<int>(type: "INTEGER", nullable: false),
                    trackability_status = table.Column<int>(type: "INTEGER", nullable: false),
                    availability_status = table.Column<int>(type: "INTEGER", nullable: false),
                    created_utc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_utc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    retired_utc = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_catalogue_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "players",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    display_name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_utc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_utc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_players", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "catalogue_items");

            migrationBuilder.DropTable(
                name: "players");
        }
    }
}
