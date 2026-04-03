# Sai

import cv2
import numpy as np
import heapq


# ------------------------------------------
# Convert image to grid
# ------------------------------------------

def image_to_grid(image_path, size=80):

    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Could not load image")

    img = cv2.resize(img, (size, size))

    _, binary = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

    grid = np.where(binary == 255, 0, 1)

    return grid.tolist()


# ------------------------------------------
# Heuristic
# ------------------------------------------

def heuristic(a, b):
    return abs(a[0]-b[0]) + abs(a[1]-b[1])


# ------------------------------------------
# A* algorithm
# ------------------------------------------

def astar(grid, start, goal):

    rows = len(grid)
    cols = len(grid[0])

    open_set = []
    heapq.heappush(open_set, (0, start))

    came_from = {}
    g_score = {start: 0}

    directions = [(0,1),(1,0),(0,-1),(-1,0)]

    while open_set:

        _, current = heapq.heappop(open_set)

        if current == goal:

            path = []

            while current in came_from:
                path.append(current)
                current = came_from[current]

            path.append(start)

            return path[::-1]

        for dx,dy in directions:

            nx = current[0] + dx
            ny = current[1] + dy

            if not (0 <= nx < rows and 0 <= ny < cols):
                continue

            if grid[nx][ny] == 1:
                continue

            neighbor = (nx,ny)

            tentative = g_score[current] + 1

            if neighbor not in g_score or tentative < g_score[neighbor]:

                came_from[neighbor] = current
                g_score[neighbor] = tentative

                f = tentative + heuristic(neighbor, goal)

                heapq.heappush(open_set, (f, neighbor))

    return None


# ------------------------------------------
# Convert path to arrows
# ------------------------------------------

def path_to_arrows(grid, path):

    rows = len(grid)
    cols = len(grid[0])

    arrow_grid = [[" " for _ in range(cols)] for _ in range(rows)]

    for r in range(rows):
        for c in range(cols):

            if grid[r][c] == 1:
                arrow_grid[r][c] = "█"

    for i in range(len(path)-1):

        x1,y1 = path[i]
        x2,y2 = path[i+1]

        if x2 == x1 and y2 == y1+1:
            arrow = "→"

        elif x2 == x1 and y2 == y1-1:
            arrow = "←"

        elif x2 == x1+1 and y2 == y1:
            arrow = "↓"

        elif x2 == x1-1 and y2 == y1:
            arrow = "↑"

        arrow_grid[x1][y1] = arrow

    end = path[-1]

    arrow_grid[end[0]][end[1]] = "E"

    return arrow_grid


# ------------------------------------------
# Print grid
# ------------------------------------------

def print_grid(grid):

    for row in grid:
        print(" ".join(row))


# ------------------------------------------
# MAIN
# ------------------------------------------

def main():

    image_path = input("Enter floorplan image path (jpg/png): ")

    grid = image_to_grid(image_path)

    start = (20,20)
    exit = (70,70)

    path = astar(grid, start, exit)

    if path is None:
        print("No path found")
        return

    arrow_map = path_to_arrows(grid, path)

    print("\nEvacuation Directions:\n")

    print_grid(arrow_map)


if __name__ == "__main__":
    main()