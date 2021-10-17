const rewire = require("rewire")
const generate_schema = rewire("./generate-schema")
const generateSchema = generate_schema.__get__("generateSchema")
// @ponicode
describe("generateSchema", () => {
    test("0", async () => {
        await generateSchema()
    })
})
