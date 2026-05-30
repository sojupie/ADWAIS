using System.ComponentModel;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adwais.Domain.Entities;

[TypeConverter(typeof(TenantIdTypeConverter))]
[JsonConverter(typeof(TenantIdJsonConverter))]
public readonly record struct TenantId(Guid Value)
{
    public static readonly TenantId Empty = new(Guid.Empty);
    public static implicit operator Guid(TenantId id) => id.Value;
    public static implicit operator TenantId(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}

public class TenantIdTypeConverter : TypeConverter
{
    public override bool CanConvertFrom(ITypeDescriptorContext? context, Type sourceType)
    {
        return sourceType == typeof(string) || sourceType == typeof(Guid) || base.CanConvertFrom(context, sourceType);
    }

    public override object? ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value)
    {
        if (value is string str)
        {
            return Guid.TryParse(str, out var guid) ? new TenantId(guid) : TenantId.Empty;
        }

        if (value is Guid guidValue)
        {
            return new TenantId(guidValue);
        }

        return base.ConvertFrom(context, culture, value);
    }

    public override bool CanConvertTo(ITypeDescriptorContext? context, Type? destinationType)
    {
        return destinationType == typeof(string) || destinationType == typeof(Guid) || base.CanConvertTo(context, destinationType);
    }

    public override object? ConvertTo(ITypeDescriptorContext? context, CultureInfo? culture, object? value, Type destinationType)
    {
        if (value is TenantId tenantId)
        {
            if (destinationType == typeof(string))
            {
                return tenantId.Value.ToString();
            }
            if (destinationType == typeof(Guid))
            {
                return tenantId.Value;
            }
        }

        return base.ConvertTo(context, culture, value, destinationType);
    }
}

public class TenantIdJsonConverter : JsonConverter<TenantId>
{
    public override TenantId Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String && Guid.TryParse(reader.GetString(), out var guid))
        {
            return new TenantId(guid);
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            // Fallback just in case it is serialized as an object with a "Value" field
            using var doc = JsonDocument.ParseValue(ref reader);
            if (doc.RootElement.TryGetProperty("Value", out var valProp) && Guid.TryParse(valProp.GetString(), out var innerGuid))
            {
                return new TenantId(innerGuid);
            }
        }

        return TenantId.Empty;
    }

    public override void Write(Utf8JsonWriter writer, TenantId value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.Value.ToString());
    }
}
