class AStarMap {
    width;
    height;

    _nodes;

    GetTile = (x, y) => {
        return this._nodes[y][x];
    }

    constructor(width, height, blockChance = 0.25, perlinZoom = 1) {
        this.width = width;
        this.height = height;

        this._nodes = [];

        for (let y = 0; y < height; y++) {
            this._nodes[y] = [];
            for (let x = 0; x < width; x++) {
                let cost = noise.perlin2(x / this.width * perlinZoom, y / this.height * perlinZoom);
                cost = (cost + 1) / 2

                this._nodes[y][x] = new Node(x, y, cost, Math.random() < blockChance);
            }
        }
    }

    FindPath = (start, goal) => {
        let open = [new AStarNode(start)];
        let closed = [];

        let node;
        goal = new AStarNode(goal);

        while (open.length) {
            node = open.reduce((prev, curr) => prev.fitness < curr.fitness ? prev : curr);

            if (node.Equals(goal)) {
                const path = [];
                let next = node;

                while (next) {
                    path.push(next);
                    next = next.parent;
                }

                return path;
            } else {
                const index = open.indexOf(node);
                open.splice(index, 1);

                closed.push(node);

                const adjacent = this.GetAdjacentNodes(node)
                for (const i in adjacent) {
                    const newNode = adjacent[i];
                    newNode.heuristic = this.Heuristic(newNode, goal);

                    let existing = open.find(n => n.Equals(newNode));
                    if (existing && existing.heuristic <= newNode.heuristic)
                        continue;

                    existing = closed.find(n => n.Equals(newNode));
                    if (existing && existing.heuristic <= newNode.heuristic)
                        continue;

                    let ind = open.indexOf(n => n.Equals(newNode));
                    if (ind > -1)
                        open.splice(ind, 1);

                    ind = closed.indexOf(n => n.Equals(newNode));
                    if (ind > -1)
                        closed.splice(ind, 1);

                    open.push(newNode);
                };
            }
        }
    }

    GetAdjacentNodes = (node) => {
        const list = [];

        for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
                if ((x == 0 && y == 0) || Math.abs(x) + Math.abs(y) == 2)
                    continue;

                const nx = node.x + x;
                const ny = node.y + y;

                if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height || this._nodes[ny][nx].blocked)
                    continue;

                list.push(new AStarNode(this._nodes[ny][nx], node));
            }
        }

        
        return list;
    }

    Heuristic = (start, goal) => {
        const x = goal.x - start.x;
        const y = goal.y - start.y;
        return Math.sqrt(x * x + y * y);
    }
}

class Node {
    x;
    y;
    blocked;
    cost;

    constructor(x, y, cost, blocked) {
        this.x = x;
        this.y = y;
        this.cost = cost;
        this.blocked = blocked;
    }

    Equals = (node) => {
        return node && node.x == this.x && node.y == this.y;
    }
}

class AStarNode extends Node {
    parent;
    totalCost;
    heuristic;

    get fitness() {
        return this.totalCost * 3 + this.heuristic;
    }

    constructor(original, parent) {
        super(original.x, original.y, original.cost)

        this.parent = parent;
        this.totalCost = parent ? parent.totalCost + this.cost : this.cost;
    }
}

var pathMap;

function CreateTileElement(node, pathInfo) {
    const element = document.createElement("div");
    element.classList.add("tile");

    element.appendChild(document.createTextNode(node.x + ";" + node.y));

    if (node.blocked)
        element.classList.add("blocked");
    else {
        const r = Math.floor(0xFF * node.cost).toString(16);
        const g = (255 - Math.floor(0xFF * node.cost)).toString(16);
        const b = "00";

        element.style.backgroundColor = "#" + r + g + b;
    }

    if (pathInfo !== undefined) {
        element.classList.add("path");
        element.appendChild(document.createElement("br"));
        element.appendChild(document.createTextNode(pathInfo.toString().slice(0, 5)));
    }

    element.setAttribute("pathing-cost", node.cost.toString().slice(0, 5));

    element.onclick = (e) => {
        console.log(e);
        FlipTileBlock(node.x, node.y);
    }

    return element;
}

function CreateWeightedTileElement(node, weight) {
    const element = document.createElement("div");
    element.classList.add("tile");

    if (node.blocked)
        element.classList.add("blocked");


    const r = (255 - Math.floor(0xFF * weight)).toString(16);
    const g = Math.floor(0xFF * weight).toString(16);
    const b = "00";

    element.style.backgroundColor = "#" + r + g + b;

    return element;
}

function RegenerateMap(width, height, blockChance = 0.25, perlinZoom = 2) {
    pathMap = new AStarMap(width, height, blockChance, perlinZoom);
    DisplayMap();
}

function DisplayMap(path) {
    document.getElementById("map-grid")?.remove();

    const table = document.createElement("table");
    table.setAttribute("id", "map-grid");
    table.setAttribute("cellspacing", "0");

    for (let y = 0; y < pathMap.height; y++) {
        let row = document.createElement("tr");
        table.append(row);

        for (let x = 0; x < pathMap.width; x++) {
            let column = document.createElement("td");
            row.append(column);

            const tile = pathMap.GetTile(x, y);
            let totalCost = path?.find(n => n.Equals(tile))?.totalCost;

            const e = CreateTileElement(tile, totalCost);
            column.append(e);
        }
    }

    document.getElementById("map-container").append(table);
}

function FindPath(startX, startY, goalX, goalY) {
    const path = pathMap.FindPath(pathMap.GetTile(startX, startY), pathMap.GetTile(goalX, goalY));
    DisplayMap(path);
}

function FlipTileBlock(x, y) {
    pathMap.GetTile(x, y).blocked = !pathMap.GetTile(x, y).blocked;
    DisplayMap();
}

function PathFormSubmit(e) {
    e.preventDefault();

    const coords = [
        parseInt(e.target.querySelector("#startX").value),
        parseInt(e.target.querySelector("#startY").value),
        parseInt(e.target.querySelector("#goalX").value),
        parseInt(e.target.querySelector("#goalY").value),
    ];

    FindPath(coords[0], coords[1], coords[2], coords[3])
}

function MapFormSubmit(e) {
    e.preventDefault();

    const params = [
        parseInt(e.target.querySelector("#width").value),
        parseInt(e.target.querySelector("#height").value),
        parseFloat(e.target.querySelector("#blockChance").value),
        parseFloat(document.body.querySelector("#zoom").value),
    ];

    if (Number.isNaN(params[0]))
        params[3] = 1;

    RegenerateMap(...params);
}

function PerlinFormSubmit(e) {
    e.preventDefault();

    const params = [
        parseFloat(e.target.querySelector("#zoom").value)
    ];

    if (Number.isNaN(params[0]))
        params[0] = 1;

    DisplayPerlinMap(params[0]);
}

window.addEventListener('DOMContentLoaded', (event) => {
    // document.addEventListener('contextmenu', event => event.preventDefault());

    document.getElementById("coords-form").onsubmit = PathFormSubmit;

    document.getElementById("map-form").onsubmit = MapFormSubmit;

    document.getElementById("perlin-form").onsubmit = PerlinFormSubmit;

    RegenerateMap(10, 10);
});

function DisplayPerlinMap(zoom = 1) {
    document.getElementById("map-grid")?.remove();

    const table = document.createElement("table");
    table.setAttribute("id", "map-grid");
    table.setAttribute("cellspacing", "0");

    for (let y = 0; y < pathMap.height; y++) {
        let row = document.createElement("tr");
        table.append(row);

        for (let x = 0; x < pathMap.width; x++) {
            let column = document.createElement("td");
            row.append(column);

            const tile = pathMap.GetTile(x, y);

            let weight = noise.perlin2(x / pathMap.width * zoom, y / pathMap.height * zoom);
            weight = (weight + 1) / 2
            const e = CreateWeightedTileElement(tile, weight);
            column.append(e);
        }
    }

    document.getElementById("map-container").append(table);
}