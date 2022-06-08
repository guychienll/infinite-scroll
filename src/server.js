import { createServer } from "miragejs";
import { faker } from "@faker-js/faker";
import { v4 as uuid } from "uuid";

createServer({
    routes() {
        this.namespace = "/api";
        this.get(
            "/posts",
            (schema, request) => {
                const totalPagesLength = 10;
                const perPagePostsLength = 10;
                const { page = "1" } = request.queryParams;
                const dataSet = Array.from({ length: totalPagesLength }, () => {
                    return Array.from({ length: perPagePostsLength }, () => ({
                        id: faker.unique(() => uuid()),
                        title: faker.lorem.sentence(5),
                        desc: faker.lorem.paragraph(7),
                        image: faker.image.animals(300, 300, true),
                        date: faker.date.past(1).toDateString(),
                    }));
                }).reduce((acc, cur, index) => {
                    acc[`${index + 1}`] = cur;
                    return acc;
                }, {});
                return {
                    total: perPagePostsLength * totalPagesLength,
                    data: dataSet?.[page] || [],
                    hasNext:
                        (dataSet?.[(Number(page) + 1).toString(10)] || [])
                            .length > 0,
                };
            },
            { timing: 500 }
        );
    },
});
