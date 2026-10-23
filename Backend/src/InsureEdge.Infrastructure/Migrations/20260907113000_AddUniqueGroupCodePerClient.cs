using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations
{
    [DbContext(typeof(InsureEdgeDbContext))]
    [Migration("20260907113000_AddUniqueGroupCodePerClient")]
    public partial class AddUniqueGroupCodePerClient : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_group_client_id_group_code",
                table: "group",
                columns: new[] { "client_id", "group_code" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_group_client_id_group_code",
                table: "group");
        }
    }
}
