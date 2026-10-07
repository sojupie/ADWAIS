// Part of the ADWAIS project, licensed under the MIT License.
// Copyright (c) 2026 Marmenlind.
// See /LICENSE for license information.
// SPDX-License-Identifier: MIT

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Adwais.Api.Extensions;

public static class SwaggerConfiguration
{
    public static bool IsEnabled(bool isBuildTime, IHostEnvironment environment, IConfiguration configuration) =>
        !isBuildTime
        && (environment.IsDevelopment()
            || configuration.GetValue<bool>("Swagger:Enabled")
            || configuration.GetValue<bool>("Authentication:EnableDemoAccess"));
}
