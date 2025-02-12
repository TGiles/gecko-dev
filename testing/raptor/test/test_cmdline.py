import os
import sys

import mozunit
import pytest

# need this so the raptor unit tests can find raptor/raptor classes
here = os.path.abspath(os.path.dirname(__file__))
raptor_dir = os.path.join(os.path.dirname(here), "raptor")
sys.path.insert(0, raptor_dir)

from argparse import ArgumentParser, Namespace

from cmdline import verify_options


def test_verify_options(filedir):
    args = Namespace(
        app="firefox",
        binary="invalid/path",
        gecko_profile="False",
        page_cycles=1,
        page_timeout=60000,
        debug="True",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    parser = ArgumentParser()

    with pytest.raises(SystemExit):
        verify_options(parser, args)

    args.binary = os.path.join(filedir, "fake_binary.exe")
    verify_options(parser, args)  # assert no exception

    args = Namespace(
        app="geckoview",
        binary="org.mozilla.geckoview_example",
        activity="org.mozilla.geckoview_example.GeckoViewActivity",
        intent="android.intent.action.MAIN",
        gecko_profile="False",
        is_release_build=False,
        host="sophie",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    verify_options(parser, args)  # assert no exception

    args = Namespace(
        app="refbrow",
        binary="org.mozilla.reference.browser",
        activity="org.mozilla.reference.browser.BrowserTestActivity",
        intent="android.intent.action.MAIN",
        gecko_profile="False",
        is_release_build=False,
        host="sophie",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    verify_options(parser, args)  # assert no exception

    args = Namespace(
        app="fenix",
        binary="org.mozilla.fenix.browser",
        activity="org.mozilla.fenix.browser.BrowserPerformanceTestActivity",
        intent="android.intent.action.VIEW",
        gecko_profile="False",
        is_release_build=False,
        host="sophie",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    verify_options(parser, args)  # assert no exception

    args = Namespace(
        app="geckoview",
        binary="org.mozilla.geckoview_example",
        activity="org.mozilla.geckoview_example.GeckoViewActivity",
        intent="android.intent.action.MAIN",
        gecko_profile="False",
        is_release_build=False,
        host="sophie",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    verify_options(parser, args)  # assert no exception

    args = Namespace(
        app="refbrow",
        binary="org.mozilla.reference.browser",
        activity=None,
        intent="android.intent.action.MAIN",
        gecko_profile="False",
        is_release_build=False,
        host="sophie",
        chimera=False,
        browsertime_video=False,
        browsertime_visualmetrics=False,
        fission=True,
        fission_mobile=False,
        test_bytecode_cache=False,
        webext=False,
        extra_prefs=[],
        benchmark_repository=None,
        benchmark_revision=None,
        benchmark_branch=None,
        post_startup_delay=None,
    )
    parser = ArgumentParser()

    verify_options(parser, args)  # also will work as uses default activity


if __name__ == "__main__":
    mozunit.main()
