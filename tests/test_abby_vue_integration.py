import os


def test_abby_vue_uses_real_core_api_and_per_factory_key():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(base, "packages", "vue", "src", "index.ts"), encoding="utf-8").read()
    assert "new Abby<" in src
    assert 'Symbol("AbbyInjectionKey")' in src
    assert "selectedVariant" in src
    assert "AbbyEventType.ACT" in src
    assert "HttpService.sendData" in src
    assert "LookupValue = unknown" in src


def test_abby_vue_type_tests_and_runtime_tests_exist():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    runtime_test = open(os.path.join(base, "packages", "vue", "tests", "useAbby.test.ts"), encoding="utf-8").read()
    type_test = open(os.path.join(base, "packages", "vue", "tests", "types.test.ts"), encoding="utf-8").read()
    assert "createAbby" in runtime_test
    assert "expectTypeOf" in type_test
    assert "getABTestValue" in type_test


def test_abby_vue_readme_documents_installation_and_provider():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    readme = open(os.path.join(base, "packages", "vue", "README.md"), encoding="utf-8").read()
    assert "pnpm add @tryabby/vue @tryabby/core" in readme
    assert "AbbyProvider" in readme
    assert "initial-data" in readme
