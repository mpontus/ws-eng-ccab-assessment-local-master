import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";
import expect from "expect";

const app = supertest(buildApp());

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function parallelChargeTest() {
    await app.post("/reset").expect(204);
    const results = await Promise.all(
        new Array(3).fill(0).map(() =>
            app.post("/charge").send({
                charges: 40,
            }),
        ),
    );
    expect(results.map((r) => r.body)).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ isAuthorized: true, remainingBalance: 60 }),
            expect.objectContaining({ isAuthorized: true, remainingBalance: 20 }),
            expect.objectContaining({ isAuthorized: false, remainingBalance: 20 }),
        ]),
    );
}

async function runTests() {
    await basicLatencyTest();
    await parallelChargeTest();
}

runTests().catch(console.error);
