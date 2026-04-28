using System;

namespace Domain.Entities;

public class GlobalConfig
{
    public int Id { get; set; } = 1;
    public DateTimeOffset? LastPolled { get; set; }
    public bool Enabled { get; set; } = true;
}