const path = require('path')

process.env.XML_CATALOG_FILES = path.join(
  __dirname,
  './packages/niso-sts-validator/NISO-STS-extended-1-MathML2-DTD/catalog-niso-sts-v1-0-no-base.xml'
)

module.exports = {
  clearMocks: true,
}
