using Adwais.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace Adwais.Infrastructure.Caching;

public class MemoryCacheService(IMemoryCache memoryCache) : ICacheService
{
    public bool TryGetValue<T>(string key, out T? value)
    {
        return memoryCache.TryGetValue(key, out value);
    }

    public void Set<T>(string key, T value, TimeSpan absoluteExpiration)
    {
        memoryCache.Set(key, value, absoluteExpiration);
    }

    public void Remove(string key)
    {
        memoryCache.Remove(key);
    }
}
