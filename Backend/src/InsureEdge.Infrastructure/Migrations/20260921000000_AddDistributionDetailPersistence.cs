using System;
using InsureEdge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

[DbContext(typeof(InsureEdgeDbContext))]
[Migration("20260921000000_AddDistributionDetailPersistence")]
public partial class AddDistributionDetailPersistence : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        CreateAddress(migrationBuilder, "intermediary_address", "intermediary_id", "intermediary");
        CreateAddress(migrationBuilder, "producer_address", "producer_id", "producer");
        migrationBuilder.CreateTable(name: "intermediary_contact", columns: table => new
        {
            id=table.Column<long>(type:"bigint",nullable:false).Annotation("Npgsql:ValueGenerationStrategy",NpgsqlValueGenerationStrategy.IdentityByDefaultColumn), client_id=table.Column<long>(type:"bigint",nullable:false), intermediary_id=table.Column<long>(type:"bigint",nullable:false), name=table.Column<string>(type:"character varying(200)",maxLength:200,nullable:true), title=table.Column<string>(type:"character varying(200)",maxLength:200,nullable:true), email_id=table.Column<string>(type:"character varying(255)",maxLength:255,nullable:true), telephone_number=table.Column<string>(type:"character varying(50)",maxLength:50,nullable:true), extension=table.Column<string>(type:"character varying(30)",maxLength:30,nullable:true), alt_telephone_no=table.Column<string>(type:"character varying(50)",maxLength:50,nullable:true), is_primary=table.Column<bool>(type:"boolean",nullable:false), created_by=table.Column<long>(type:"bigint",nullable:true), created_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:false), updated_by=table.Column<long>(type:"bigint",nullable:true), updated_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:true)
        }, constraints: table => { table.PrimaryKey("pk_intermediary_contact",x=>x.id); table.ForeignKey("fk_intermediary_contact_intermediary_intermediary_id",x=>x.intermediary_id,"intermediary","id",onDelete:ReferentialAction.Cascade); });
        migrationBuilder.CreateIndex("ix_intermediary_contact_client_id_intermediary_id","intermediary_contact",new[] {"client_id","intermediary_id"});
        CreateState(migrationBuilder,"intermediary_nr_state","intermediary_id","intermediary", "license");
        CreateState(migrationBuilder,"producer_nr_state","producer_id","producer", "license_number");
    }

    protected override void Down(MigrationBuilder migrationBuilder) { migrationBuilder.DropTable("producer_nr_state"); migrationBuilder.DropTable("intermediary_nr_state"); migrationBuilder.DropTable("intermediary_contact"); migrationBuilder.DropTable("producer_address"); migrationBuilder.DropTable("intermediary_address"); }

    private static void CreateAddress(MigrationBuilder m,string tableName,string ownerColumn,string ownerTable) {
        m.CreateTable(name:tableName,columns:table=>new { id=table.Column<long>(type:"bigint",nullable:false).Annotation("Npgsql:ValueGenerationStrategy",NpgsqlValueGenerationStrategy.IdentityByDefaultColumn), client_id=table.Column<long>(type:"bigint",nullable:false), owner_id=table.Column<long>(name:ownerColumn,type:"bigint",nullable:false), address_line1=table.Column<string>(type:"character varying(250)",maxLength:250,nullable:true), address_line2=table.Column<string>(type:"character varying(250)",maxLength:250,nullable:true), country=table.Column<string>(type:"character varying(100)",maxLength:100,nullable:true), state=table.Column<string>(type:"character varying(100)",maxLength:100,nullable:true), city=table.Column<string>(type:"character varying(100)",maxLength:100,nullable:true), county=table.Column<string>(type:"character varying(100)",maxLength:100,nullable:true), zip_code=table.Column<string>(type:"character varying(30)",maxLength:30,nullable:true), latitude=table.Column<string>(type:"character varying(50)",maxLength:50,nullable:true), longitude=table.Column<string>(type:"character varying(50)",maxLength:50,nullable:true), created_by=table.Column<long>(type:"bigint",nullable:true), created_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:false), updated_by=table.Column<long>(type:"bigint",nullable:true), updated_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:true)},constraints:table=>{table.PrimaryKey("pk_"+tableName,x=>x.id);table.ForeignKey("fk_"+tableName+"_"+ownerTable+"_"+ownerColumn,x=>x.owner_id,ownerTable,"id",onDelete:ReferentialAction.Cascade);}); m.CreateIndex("ix_"+tableName+"_client_id_"+ownerColumn,tableName,new[]{"client_id",ownerColumn},unique:true); }
    private static void CreateState(MigrationBuilder m,string tableName,string ownerColumn,string ownerTable,string licenseColumn) { m.CreateTable(name:tableName,columns:table=>new { id=table.Column<long>(type:"bigint",nullable:false).Annotation("Npgsql:ValueGenerationStrategy",NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),client_id=table.Column<long>(type:"bigint",nullable:false),owner_id=table.Column<long>(name:ownerColumn,type:"bigint",nullable:false),state=table.Column<string>(type:"character varying(100)",maxLength:100,nullable:false),license=table.Column<string>(name:licenseColumn,type:"character varying(100)",maxLength:100,nullable:true),is_available_in_search=table.Column<bool>(type:"boolean",nullable:false),created_by=table.Column<long>(type:"bigint",nullable:true),created_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:false),updated_by=table.Column<long>(type:"bigint",nullable:true),updated_on=table.Column<DateTime>(type:"timestamp without time zone",nullable:true)},constraints:table=>{table.PrimaryKey("pk_"+tableName,x=>x.id);table.ForeignKey("fk_"+tableName+"_"+ownerTable+"_"+ownerColumn,x=>x.owner_id,ownerTable,"id",onDelete:ReferentialAction.Cascade);});m.CreateIndex("ix_"+tableName+"_client_id_"+ownerColumn+"_state",tableName,new[]{"client_id",ownerColumn,"state"},unique:true); }
}
