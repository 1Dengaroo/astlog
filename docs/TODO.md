# sigdiff - TODO

## Done

- [x] Published to npm as `sigdiff@0.1.0`
- [x] README with comparison table and usage examples
- [x] CI (GitHub Actions: build + test + api surface check)

## Known Issues / Future

- [ ] Duplicate removals when same symbol is exported from multiple files
- [ ] `compilerOptions` param on `extract()` leaks `ts.CompilerOptions` - public API should accept plain `object`
- [ ] Implement rules from [semver-ts.org](https://www.semver-ts.org/) spec
