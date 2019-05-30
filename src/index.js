import "./styles.css";
import * as d3 from "d3";
const margin = 96;
const w = window.innerWidth - margin * 2;
const h = window.innerHeight - margin * 2;
let isPack = true;
const userSelected = [];
const svg = d3
  .select("svg")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight)
  .style("background-color", "#fff");

d3.select(".clicker").on("click", () => {
  isPack = !isPack;
  drawDatapoints();
});

const dataset = d3.range(50 + Math.floor(Math.random() * 100)).map((d, i) => ({
  radiusVar: Math.random() * 12 + 6,
  xVar: Math.random() * w + margin,
  yVar: Math.random() * h + margin,
  id: "id" + i,
  groupVar: d3.shuffle(["A", "B", "C", "C", "D", "A", "C"])[0],
  subgroupVar: d3.shuffle(["xyz", "xyz", "abc", "abc", "xyz"])[0]
}));

const g = svg
  .append("g")
  .attr("class", "main")
  .attr("transition", `translate(${margin * 2}, ${margin * 2})`);

function drawDatapoints() {
  g.selectAll("g.datapoint")
    .data(getData(), d => d.id)
    .join(onEnter, update => update, onExit)
    .call(onUpdate)
    .filter(d => !d.children)
    .raise();
}

function onEnter(selection) {
  const makeDatapoint = g =>
    g
      .append("circle")
      .attr("cx", d => d.px)
      .attr("cy", d => (h + margin * 2) / 2)
      .attr("r", d => 0)
      .style("fill", "green")
      .style("stroke", "black")
      .style("opacity", 0.3)
      .call(handleEvents);

  return selection
    .append("g")
    .attr("class", "datapoint")
    .call(makeDatapoint);
}

function onUpdate(selection) {
  selection
    .select("circle")
    .style("pointer-events", "none")
    .transition()
    .duration(3000)
    .style("fill", d => (userSelected.includes(d.id) ? "orange" : "steelblue"))
    .attr("cx", d => d.px)
    .attr("cy", d => d.py)
    .attr("r", d => d.pr)
    .on("end", (d, i, n) => {
      d3.select(n[i]).style("pointer-events", null);
    });
}

function onExit(selection) {
  selection
    .select("circle")
    .style("pointer-events", "none")
    .transition()
    .duration(3000)
    .attr("r", d => 0)
    .style("fill", "red")
    .on("end", () => selection.remove());
}

// function drawDatapoints() {

//   const dataSelection = g.selectAll("g.datapoint")
//     .data(getData(), d => d.id);

//   const enterG = dataSelection.enter()
//     .append("g")
//     .attr("class", "datapoint");

//   onEnter(enterG);
//   onUpdate(dataSelection.merge(enterG));
//   onExit(dataSelection.exit());

//   dataSelection.filter(d => !d.children).raise();
// }

// function drawDatapoints() {
//   const dataSelection = g.selectAll("g.datapoint")
//     .data(getData(), d => d.id);

//   const enterG = dataSelection
//     .enter()
//     .append("g")
//     .attr("class", "datapoint")
//     .call(s =>
//       s.append("circle")
//         .attr("cx", d => d.px)
//         .attr("cy", d => h / 2)
//         .attr("r", d => 0)
//         .style("fill", "green")
//         .style("stroke", "black")
//         .style("opacity", 0.3)
//         .call(handleEvents)
//     );

//   dataSelection.merge(enterG).call(s =>
//     s
//       .select("circle")
//       .style("pointer-events", "none") // disable pointer events before transition
//       .transition()
//       .duration(3000)
//       .style("fill", "steelblue")
//       .attr("cx", d => d.px)
//       .attr("cy", d => d.py)
//       .attr("r", d => d.pr)
//       .on("end", (d, i, n) => {
//         // reenable pointer events on transition end
//         d3.select(n[i]).style("pointer-events", null);
//       })
//   );

//   dataSelection.exit().call(s =>
//     s
//       .selectAll("circle")
//       .style("pointer-events", "none")
//       .transition()
//       .duration(3000)
//       .style("fill", "red")
//       .attr("r", d => 0)
//       .on("end", s.remove)
//   );

//   dataSelection.filter(d => !d.children).raise();
// }

function handleEvents(selection) {
  selection.on("mouseover", (d, i, n) => {
    d3.select(n[i]) // <circle>
      .style("stroke-width", 3)
      .style("opacity", 0.8);

    d3.select(n[i].parentElement) // <g>
      .append("text")
      .attr("dx", d.px)
      .attr("dy", d.py)
      .style("opacity", 0.0)
      .style("text-anchor", "middle")
      .style("alignment-baseline", "central")
      .style("fill", "black")
      .transition()
      .style("opacity", 1)
      .style("pointer-events", "none")
      .text(d.id);
  });
  selection
    .on("mouseout", (d, i, n) => {
      d3.select(n[i])
        .transition()
        .style("stroke-width", 1)
        .style("opacity", 0.3);
      d3.select(n[i].parentElement)
        .select("text")
        .remove();
    })
    .on("mouseup", (d, i, n) => {
      const index = userSelected.indexOf(d.id);
      if (index >= 0) {
        d3.select(n[i]).style("fill", "steelblue");
        userSelected.splice(index, 1);
      } else {
        d3.select(n[i]).style("fill", "orange");
        userSelected.push(d.id);
      }
    });
}

function getData() {
  const hierarchy = makeHierarchy(dataset, v => d3.sum(v, d => d.radiusVar), [
    d => d.groupVar,
    d => d.subgroupVar,
    d => d.id
  ]);

  const data = isPack
    ? pack(hierarchy)
        .descendants()
        .slice(1)
    : dataset;

  return data.map(d => ({
    ...d,
    id: d.id || d.data[0],
    px: d.x || d.xVar,
    py: d.y || d.yVar,
    pr: d.r || d.radiusVar
  }));
}

function pack(hierarchyData) {
  return d3
    .pack()
    .size([w + margin, h + margin])
    .padding(2)(hierarchyData);
}

// https://medium.com/data-visualization-society/making-hierarchy-layouts-with-d3-hierarchy-fdb36d0a9c56
function makeHierarchy(data, reduce, groupBy, ...config) {
  const defaultConfig = {
    childrenAccessorFn: ([key, value]) =>
      value && value.size && Array.from(value),
    sumFn: ([, value]) => value,
    sortFn: (a, b) => b.value - a.value
  };

  const combinedConfig = { ...defaultConfig, ...config, data, reduce, groupBy };
  const { childrenAccessorFn, sumFn, sortFn } = combinedConfig;

  if (!data || !data.length)
    return new Error("No array data specified or array data is empty");
  if (!groupBy || !groupBy.length || typeof groupBy[0] !== "function")
    return new Error("No groupBy functions specified");
  if (!reduce || typeof reduce !== "function")
    return new Error("No reduce specified, or reduce not a function.");

  const rollupData = rollup(data, reduce, ...groupBy);
  const hierarchyData = d3
    .hierarchy([null, rollupData], childrenAccessorFn)
    .sum(sumFn)
    .sort(sortFn);

  return hierarchyData;
}

// https://github.com/d3/d3-array/blob/v2.0.3/src/rollup.js
function dogroup(values, keyof) {
  const map = new Map();
  let index = -1;
  for (const value of values) {
    const key = keyof(value, ++index, values);
    const group = map.get(key);
    if (group) group.push(value);
    else map.set(key, [value]);
  }
  return map;
}

function rollup(values, reduce, ...keys) {
  return (function regroup(values, i) {
    if (i >= keys.length) return reduce(values);
    const map = dogroup(values, keys[i]);
    return new Map(Array.from(map, ([k, v]) => [k, regroup(v, i + 1)]));
  })(values, 0);
}
