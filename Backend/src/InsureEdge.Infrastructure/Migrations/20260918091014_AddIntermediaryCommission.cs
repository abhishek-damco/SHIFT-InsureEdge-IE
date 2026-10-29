using System;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

/// <summary>Stores default product commissions assigned to an intermediary.</summary>
[DbContext(typeof(InsureEdgeDbContext))]
[Migration("20260918091014_AddIntermediaryCommission")]
public partial class AddIntermediaryCommission : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "intermediary_commission",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                intermediary_id = table.Column<long>(type: "bigint", nullable: false),
                company_id = table.Column<long>(type: "bigint", nullable: false),
                product_id = table.Column<long>(type: "bigint", nullable: false),
                sub_product_id = table.Column<long>(type: "bigint", nullable: false),
                insurance_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                juridiction_state = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                effective_date = table.Column<DateOnly>(type: "date", nullable: false),
                new_business_commission = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                renewal_commission = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                created_by = table.Column<long>(type: "bigint", nullable: true),
                created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                updated_by = table.Column<long>(type: "bigint", nullable: true),
                updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_intermediary_commission", x => x.id);
                table.ForeignKey("fk_intermediary_commission_intermediary_intermediary_id", x => x.intermediary_id, "intermediary", "id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("fk_intermediary_commission_insurance_product_product_id", x => x.product_id, "insurance_product", "id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("fk_intermediary_commission_insurance_sub_product_sub_product_id", x => x.sub_product_id, "insurance_sub_product", "id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("ix_intermediary_commission_client_id_intermediary_id", "intermediary_commission", new[] { "client_id", "intermediary_id" });
        migrationBuilder.CreateIndex("ix_intermediary_commission_product_id", "intermediary_commission", "product_id");
        migrationBuilder.CreateIndex("ix_intermediary_commission_sub_product_id", "intermediary_commission", "sub_product_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "intermediary_commission");
}
