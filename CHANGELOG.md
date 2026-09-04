# Changelog

## [1.3.0](https://github.com/cds-snc/canadalogin-partner-portal/compare/v1.2.1...v1.3.0) (2026-09-04)


### Features

* concurrent session with bug on logout page ([#180](https://github.com/cds-snc/canadalogin-partner-portal/issues/180)) ([3f15891](https://github.com/cds-snc/canadalogin-partner-portal/commit/3f158912be6152aaee5aa8f315e0dfe94ffb394f))
* **portal:** deliver MVP2 onboarding, RP configuration, and invitation workflows ([#160](https://github.com/cds-snc/canadalogin-partner-portal/issues/160)) ([9eae2c7](https://github.com/cds-snc/canadalogin-partner-portal/commit/9eae2c78403361064ee08636ba6c9d9eabb0d7f8))


### Bug Fixes

* add login logout logging and session doc ([#163](https://github.com/cds-snc/canadalogin-partner-portal/issues/163)) ([93cc63c](https://github.com/cds-snc/canadalogin-partner-portal/commit/93cc63c5aded03cf90ad6d69e1cab0cd29209a91))
* remove fast-uri overrides ([#182](https://github.com/cds-snc/canadalogin-partner-portal/issues/182)) ([2af4b3c](https://github.com/cds-snc/canadalogin-partner-portal/commit/2af4b3c03755818defb375451057f70b3971cafc))


### Miscellaneous Chores

* **deps:** bump cryptography from 48.0.1 to 50.0.0 in /backend ([#147](https://github.com/cds-snc/canadalogin-partner-portal/issues/147)) ([4a182b0](https://github.com/cds-snc/canadalogin-partner-portal/commit/4a182b0ff59b0ac21cc32fdd55f40f4521994190))
* **deps:** lock file maintenance ([#153](https://github.com/cds-snc/canadalogin-partner-portal/issues/153)) ([a3fb714](https://github.com/cds-snc/canadalogin-partner-portal/commit/a3fb7148f1a2e714b4f6f6dac36aec4438975d28))
* **deps:** update aws-actions/amazon-ecr-login action to v2.1.7 ([#167](https://github.com/cds-snc/canadalogin-partner-portal/issues/167)) ([556cb40](https://github.com/cds-snc/canadalogin-partner-portal/commit/556cb406c4de0a95d655c93e4e5fbad392f3ca53))
* **portal:** undo changes from [#160](https://github.com/cds-snc/canadalogin-partner-portal/issues/160) ([#168](https://github.com/cds-snc/canadalogin-partner-portal/issues/168)) ([aaa5331](https://github.com/cds-snc/canadalogin-partner-portal/commit/aaa53310bf71f0e6605e7e1d10ef3d5a27230f58))


### Continuous Integration

* **tests:** Run backend and frontend unit tests on pull requests ([#177](https://github.com/cds-snc/canadalogin-partner-portal/issues/177)) ([35d2539](https://github.com/cds-snc/canadalogin-partner-portal/commit/35d2539b656237b2bd3960db7e63d851358d6d1c))


### Documentation

* **security:** document partner portal trust boundaries ([#166](https://github.com/cds-snc/canadalogin-partner-portal/issues/166)) ([2c3531f](https://github.com/cds-snc/canadalogin-partner-portal/commit/2c3531fcd783eb60d028292db16367b31ab1e698))

## [1.2.1](https://github.com/cds-snc/canadalogin-partner-portal/compare/v1.2.0...v1.2.1) (2026-08-11)


### Bug Fixes

* **ci/cd:** Resolve docker tagging issue with CI/CD pipeline ([#151](https://github.com/cds-snc/canadalogin-partner-portal/issues/151)) ([f14a516](https://github.com/cds-snc/canadalogin-partner-portal/commit/f14a516df81a23773d823c29bb135c330384a697))

## [1.2.0](https://github.com/cds-snc/canadalogin-partner-portal/compare/v1.1.0...v1.2.0) (2026-08-10)


### Features

* **actions:** add intial dev release pipeline ([#124](https://github.com/cds-snc/canadalogin-partner-portal/issues/124)) ([3571b96](https://github.com/cds-snc/canadalogin-partner-portal/commit/3571b96a32151cab075458422b64f2cb773c740f))


### Bug Fixes

* **actions:** resolve pnpm setup and SBOM permission issues ([#127](https://github.com/cds-snc/canadalogin-partner-portal/issues/127)) ([80fb81f](https://github.com/cds-snc/canadalogin-partner-portal/commit/80fb81fe5993c3e61ea7e7acf33ea4075d1cdd4d))


### Miscellaneous Chores

* Configure Renovate ([#140](https://github.com/cds-snc/canadalogin-partner-portal/issues/140)) ([c09615a](https://github.com/cds-snc/canadalogin-partner-portal/commit/c09615a73c36c7b983e66a5e410b2bd8f48e395a))
* **deps:** add renovate.json ([c09615a](https://github.com/cds-snc/canadalogin-partner-portal/commit/c09615a73c36c7b983e66a5e410b2bd8f48e395a))
* **deps:** bump joserfc from 1.6.5 to 1.6.8 in /backend ([#105](https://github.com/cds-snc/canadalogin-partner-portal/issues/105)) ([07c6414](https://github.com/cds-snc/canadalogin-partner-portal/commit/07c64149fb7f81f1c25327f86867bdcbc9cd4f8a))
* **deps:** bump pyasn1 from 0.6.3 to 0.6.4 in /backend ([#130](https://github.com/cds-snc/canadalogin-partner-portal/issues/130)) ([2508db7](https://github.com/cds-snc/canadalogin-partner-portal/commit/2508db7e80de7eebbb3d0ec270bf7a350e78d18a))
* **deps:** update all non-major github action dependencies ([#150](https://github.com/cds-snc/canadalogin-partner-portal/issues/150)) ([57523d2](https://github.com/cds-snc/canadalogin-partner-portal/commit/57523d2843855fb5466272ff2a51bcc1b274e298))
* **frontend:** add pnpm lockfile ([#129](https://github.com/cds-snc/canadalogin-partner-portal/issues/129)) ([6e67fd1](https://github.com/cds-snc/canadalogin-partner-portal/commit/6e67fd14818aefc514617d0d824d7b149dccb876))


### Continuous Integration

* add Slack notifications for deployment start, success, and failure ([#136](https://github.com/cds-snc/canadalogin-partner-portal/issues/136)) ([5b074d7](https://github.com/cds-snc/canadalogin-partner-portal/commit/5b074d7e6cd80d92504cab9334a1ffc2d3ee1187))
* integrate release-please into release-pipeline and add deployed_versions ([#133](https://github.com/cds-snc/canadalogin-partner-portal/issues/133)) ([e2ef77c](https://github.com/cds-snc/canadalogin-partner-portal/commit/e2ef77cb6601657da6474f5b4a54a5cbc7898cab))
* introduce matrix structure for build and deploy jobs (dev only) ([#135](https://github.com/cds-snc/canadalogin-partner-portal/issues/135)) ([764bbe7](https://github.com/cds-snc/canadalogin-partner-portal/commit/764bbe7a55ef8e50b17d4a2a75357067350e032d))
* tag Docker images with semver versions ([#134](https://github.com/cds-snc/canadalogin-partner-portal/issues/134)) ([c946e60](https://github.com/cds-snc/canadalogin-partner-portal/commit/c946e60b58df4f677b5d6e41fa5cb4187647566d))


### Documentation

* add partner portal onboarding PRD draft ([#131](https://github.com/cds-snc/canadalogin-partner-portal/issues/131)) ([a052914](https://github.com/cds-snc/canadalogin-partner-portal/commit/a05291418976a7326fe772e994ddccebdb089916))

## [1.1.0](https://github.com/cds-snc/canadalogin-partner-portal/compare/v1.0.0...v1.1.0) (2026-07-17)


### Features

* 41 client secret manage page ([#69](https://github.com/cds-snc/canadalogin-partner-portal/issues/69)) ([22dd4de](https://github.com/cds-snc/canadalogin-partner-portal/commit/22dd4de55e61cc55ab6b8967eb14633317404631))
* 42 minimal rp config profile ([#51](https://github.com/cds-snc/canadalogin-partner-portal/issues/51)) ([8a28ce4](https://github.com/cds-snc/canadalogin-partner-portal/commit/8a28ce4ec1938a1801c5732de94d15e41403a136))
* 43 application mau report backend ([#56](https://github.com/cds-snc/canadalogin-partner-portal/issues/56)) ([aad31c6](https://github.com/cds-snc/canadalogin-partner-portal/commit/aad31c6cce0f75741b043e5a060d586f71aea99e))
* adding PR title check ([#121](https://github.com/cds-snc/canadalogin-partner-portal/issues/121)) ([eecbb63](https://github.com/cds-snc/canadalogin-partner-portal/commit/eecbb63bf19b848ad7834b52accd21f7d009e3ba))
* Adding Release Please to the partner portal repo ([#119](https://github.com/cds-snc/canadalogin-partner-portal/issues/119)) ([c47be09](https://github.com/cds-snc/canadalogin-partner-portal/commit/c47be09cfb81f05147bd209cc5a907e9014a16a4))
* audit table plus fix of arq db session ([#53](https://github.com/cds-snc/canadalogin-partner-portal/issues/53)) ([b4b9eb9](https://github.com/cds-snc/canadalogin-partner-portal/commit/b4b9eb9b1b73e644c0b86822d1ae3d8ec4e25230))
* audit trail page ([#67](https://github.com/cds-snc/canadalogin-partner-portal/issues/67)) ([ac954d8](https://github.com/cds-snc/canadalogin-partner-portal/commit/ac954d8d3be6a4620dad7908cc031a6a8b9f78a3))
* **backend:** migrate IBM Verify clients to async community SDK v0.2.0 ([#45](https://github.com/cds-snc/canadalogin-partner-portal/issues/45)) ([123b18e](https://github.com/cds-snc/canadalogin-partner-portal/commit/123b18e02545416ff11c88da6475fbfa0e437d5d))
* **backend:** wire standardized error logging into exception handlers ([#80](https://github.com/cds-snc/canadalogin-partner-portal/issues/80)) ([04dbdeb](https://github.com/cds-snc/canadalogin-partner-portal/commit/04dbdeb1877e2e0cfa12de0a0365e1a5a72c3091))
* **frontend:** fix manage credentials UI and update functionality ([#108](https://github.com/cds-snc/canadalogin-partner-portal/issues/108)) ([1deab79](https://github.com/cds-snc/canadalogin-partner-portal/commit/1deab79fe97e6e7a2794b0610154ccc71be88a52))
* limit to owners from verify access to this app ([#50](https://github.com/cds-snc/canadalogin-partner-portal/issues/50)) ([e7346b7](https://github.com/cds-snc/canadalogin-partner-portal/commit/e7346b7b4abf4c526862004340406fa150d9365e))
* redis ssl and minor lint ([#95](https://github.com/cds-snc/canadalogin-partner-portal/issues/95)) ([38a6c21](https://github.com/cds-snc/canadalogin-partner-portal/commit/38a6c2152fc1ca68bd20d097e6ee3eb876bc54c8))
* **rp-application-details:** add rp application details page ([#62](https://github.com/cds-snc/canadalogin-partner-portal/issues/62)) ([866bbf2](https://github.com/cds-snc/canadalogin-partner-portal/commit/866bbf2be50a1668dd9572a5be0edee2854a0b21))
* **rp-applications:** enforce department assignment before owner access ([#75](https://github.com/cds-snc/canadalogin-partner-portal/issues/75)) ([856d317](https://github.com/cds-snc/canadalogin-partner-portal/commit/856d31749ed9d74f2f962efc3d3d07c00224a39c))
* sample AWS deployment ([#89](https://github.com/cds-snc/canadalogin-partner-portal/issues/89)) ([0960442](https://github.com/cds-snc/canadalogin-partner-portal/commit/0960442b317fb1a04b45b10e78aaf0d0f71f92e6))
* terms and conditions ([#55](https://github.com/cds-snc/canadalogin-partner-portal/issues/55)) ([0f5d936](https://github.com/cds-snc/canadalogin-partner-portal/commit/0f5d936a52ec146d1dc9756eb0e8d4acf2f1e37a))
* timeout warning ([#32](https://github.com/cds-snc/canadalogin-partner-portal/issues/32)) ([d8ea3b7](https://github.com/cds-snc/canadalogin-partner-portal/commit/d8ea3b71154077bf3575edb7e0a6809bd21e3078))


### Bug Fixes

* add BFF and remove password bcrypt ([#71](https://github.com/cds-snc/canadalogin-partner-portal/issues/71)) ([d3635df](https://github.com/cds-snc/canadalogin-partner-portal/commit/d3635dfc70a12d7fb0f9b388ab6773655f44e251))
* **backend:** return typed IBM Verify SDK response models in admin and user clients ([#54](https://github.com/cds-snc/canadalogin-partner-portal/issues/54)) ([3da202c](https://github.com/cds-snc/canadalogin-partner-portal/commit/3da202cc318e5420bab5b0f6d35d4262c9724f92))
* **backend:** user model ([#114](https://github.com/cds-snc/canadalogin-partner-portal/issues/114)) ([81c6994](https://github.com/cds-snc/canadalogin-partner-portal/commit/81c6994c614ced9c57c5e59d8dae062815de5542))
* delete demo folder ([#64](https://github.com/cds-snc/canadalogin-partner-portal/issues/64)) ([3e1e3bb](https://github.com/cds-snc/canadalogin-partner-portal/commit/3e1e3bb436e64022503b45ef339deb9578d2776b))
* **frontend:** apply designer feedback across UI/UX ([#102](https://github.com/cds-snc/canadalogin-partner-portal/issues/102)) ([55d8614](https://github.com/cds-snc/canadalogin-partner-portal/commit/55d8614eac9188324577c3e75e3f8714c41b6bae))
* **frontend:** ux improvements to usage report page and new terms of service state ([#87](https://github.com/cds-snc/canadalogin-partner-portal/issues/87)) ([563ecd1](https://github.com/cds-snc/canadalogin-partner-portal/commit/563ecd110ea3a4aec76f716ebf8a17f311b1091f))
* pyjwt upgrade ([#91](https://github.com/cds-snc/canadalogin-partner-portal/issues/91)) ([da297e0](https://github.com/cds-snc/canadalogin-partner-portal/commit/da297e0b8fe8f4b0fdd3dbcc47a06f7b31a87ca3))
* **rp-applications:** demo cleanup for rp-application pages ([#83](https://github.com/cds-snc/canadalogin-partner-portal/issues/83)) ([1b19600](https://github.com/cds-snc/canadalogin-partner-portal/commit/1b196007ddb67b710ef10878b6ca35d27cbde997))


### Code Refactoring

* ui clean ([#82](https://github.com/cds-snc/canadalogin-partner-portal/issues/82)) ([888f420](https://github.com/cds-snc/canadalogin-partner-portal/commit/888f4207c96b1bbe1e4ef2309b0201664ec23b28))


### Miscellaneous Chores

* add LICENSE and SECURITY.md ([c5afe4d](https://github.com/cds-snc/canadalogin-partner-portal/commit/c5afe4d9ac6d2a6704d0153bcd90d05ecadc29f3))
* add LICENSE and SECURITY.md ([0cdbbdf](https://github.com/cds-snc/canadalogin-partner-portal/commit/0cdbbdf903393fc10f2797802751b0ed7dad70a3))
* **deps-dev:** bump vite from 8.0.7 to 8.0.16 in /frontend ([#58](https://github.com/cds-snc/canadalogin-partner-portal/issues/58)) ([c87f994](https://github.com/cds-snc/canadalogin-partner-portal/commit/c87f99492b31643cde44c851e4cba1f313032c66))
* **deps:** bump cryptography from 46.0.7 to 48.0.1 in /backend ([#59](https://github.com/cds-snc/canadalogin-partner-portal/issues/59)) ([d34b698](https://github.com/cds-snc/canadalogin-partner-portal/commit/d34b6984048b361ed23967a0c63f1cec3c8883d5))
* **deps:** bump pydantic-settings from 2.13.1 to 2.14.2 in /backend ([#78](https://github.com/cds-snc/canadalogin-partner-portal/issues/78)) ([f481485](https://github.com/cds-snc/canadalogin-partner-portal/commit/f4814851b49b8df275e09c4452fe89c7b43f9751))
* **deps:** bump python-multipart from 0.0.27 to 0.0.31 in /backend ([#60](https://github.com/cds-snc/canadalogin-partner-portal/issues/60)) ([17de39a](https://github.com/cds-snc/canadalogin-partner-portal/commit/17de39ae8efa9fd066f03f25a198b4726ad9ade1))
* **deps:** bump starlette from 1.0.1 to 1.3.1 in /backend ([#61](https://github.com/cds-snc/canadalogin-partner-portal/issues/61)) ([c3150c1](https://github.com/cds-snc/canadalogin-partner-portal/commit/c3150c1da5309bfac7504834f8be424309228989))
* **frontend:** clean up UI and stabilize tests/build for breadcrumb refactor ([#68](https://github.com/cds-snc/canadalogin-partner-portal/issues/68)) ([7af25e8](https://github.com/cds-snc/canadalogin-partner-portal/commit/7af25e80be9fb89f057334fdd52ea114b119792e))
