using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class ExtendClaimAuthority : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "approved_lob",
            table: "claim_authorities",
            type: "character varying(200)",
            maxLength: 200,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "currency",
            table: "claim_authorities",
            type: "character varying(10)",
            maxLength: 10,
            nullable: false,
            defaultValue: "USD");

        migrationBuilder.AddColumn<decimal>(
            name: "fee_payment_limit",
            table: "claim_authorities",
            type: "numeric(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "ex_gratia_payment_limit",
            table: "claim_authorities",
            type: "numeric(18,2)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<string>(
            name: "jurisdiction_location",
            table: "claim_authorities",
            type: "text",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "approved_lob",          table: "claim_authorities");
        migrationBuilder.DropColumn(name: "currency",              table: "claim_authorities");
        migrationBuilder.DropColumn(name: "fee_payment_limit",     table: "claim_authorities");
        migrationBuilder.DropColumn(name: "ex_gratia_payment_limit", table: "claim_authorities");
        migrationBuilder.DropColumn(name: "jurisdiction_location", table: "claim_authorities");
    }
}
