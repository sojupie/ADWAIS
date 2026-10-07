// Part of the ADWAIS project, licensed under the MIT License.
// Copyright (c) 2026 Marmenlind.
// See /LICENSE for license information.
// SPDX-License-Identifier: MIT

using Adwais.Api.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Moq;

namespace Adwais.Tests.Extensions;

public class SwaggerConfigurationTests
{
    [Fact]
    public void IsEnabled_WhenDemoAccessIsEnabledInProduction_ReturnsTrue()
    {
        var environment = Mock.Of<IHostEnvironment>(host => host.EnvironmentName == Environments.Production);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Authentication:EnableDemoAccess"] = "true"
            })
            .Build();

        Assert.True(SwaggerConfiguration.IsEnabled(false, environment, configuration));
    }
}
