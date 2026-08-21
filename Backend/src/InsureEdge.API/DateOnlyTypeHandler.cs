// Dapper has no built-in DateOnly support — registered in Program.cs.
using System.Data;
using Dapper;

namespace InsureEdge.API;

public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly value) =>
        parameter.Value = value.ToDateTime(TimeOnly.MinValue);

    public override DateOnly Parse(object value) => DateOnly.FromDateTime((DateTime)value);
}

public class NullableDateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly?>
{
    public override void SetValue(IDbDataParameter parameter, DateOnly? value) =>
        parameter.Value = value == null ? DBNull.Value : value.Value.ToDateTime(TimeOnly.MinValue);

    public override DateOnly? Parse(object value) =>
        value == null || value is DBNull ? null : DateOnly.FromDateTime((DateTime)value);
}
