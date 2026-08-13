// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Application.Interfaces;
using Moq;

namespace Adwais.Tests.Services;

public class ProviderSelectionExtensionsTests
{
    [Fact]
    public void ForProvider_SelectsTheMatchingOrderSource()
    {
        var litium = new Mock<IOrderSource>();
        litium.SetupGet(source => source.Provider).Returns("litium");
        var other = new Mock<IOrderSource>();
        other.SetupGet(source => source.Provider).Returns("other");

        var selected = new IOrderSource[] { other.Object, litium.Object }.ForProvider("litium");

        Assert.Same(litium.Object, selected);
    }

    [Fact]
    public void ForProvider_ThrowsWhenNoMonitoringProviderIsRegistered()
    {
        var provider = new Mock<IMonitoringProvider>();
        provider.SetupGet(candidate => candidate.Provider).Returns("uptimerobot");

        Assert.Throws<InvalidOperationException>(() => new[] { provider.Object }.ForProvider("other"));
    }
}
