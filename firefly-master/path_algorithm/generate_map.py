import cv2
import numpy as np
import os

# Create a white background (free space) image of size 800x800
# The larger size provides more resolution for detailed structures.
img = np.ones((800, 800), dtype=np.uint8) * 255

def draw_wall(x1, y1, x2, y2):
    """Helper to draw solid black obstacles/walls"""
    cv2.rectangle(img, (x1, y1), (x2, y2), 0, -1)

# Outer Boundaries (20px thick)
draw_wall(0, 0, 800, 20)      # Top
draw_wall(0, 780, 800, 800)   # Bottom
draw_wall(0, 0, 20, 800)      # Left
draw_wall(780, 0, 800, 800)   # Right

# Main Horizontal Corridors Walls
# Top corridor creating a 2-hallway system
draw_wall(20, 250, 300, 270)  
draw_wall(380, 250, 780, 270) # Doorway at x=300 to 380

# Bottom corridor
draw_wall(20, 500, 500, 520)  
draw_wall(600, 500, 780, 520) # Doorway at x=500 to 600

# Vertical Walls (creating segmented rooms)
# Top left partitioned room
draw_wall(250, 20, 270, 150)  
draw_wall(250, 200, 270, 250) # Door gap

# Top right room divider
draw_wall(500, 20, 520, 270)  # Solid wall

# Middle complex (Labs/Cubicles)
draw_wall(250, 270, 270, 400)
draw_wall(250, 470, 270, 500) # Gap

draw_wall(500, 270, 520, 350)
draw_wall(500, 420, 520, 500) # Gap

# Bottom section dividers
draw_wall(350, 520, 370, 700) # Door gap at the bottom

# Internal Room Obstacles (These simulate desks, server racks, shelves)
# Left Room "Server Racks"
draw_wall(60, 60, 100, 200)
draw_wall(140, 60, 180, 200)

# Right Room "Large Conference Table"
draw_wall(580, 80, 720, 160)

# Middle area "Cubicles"
draw_wall(320, 320, 360, 360)
draw_wall(400, 320, 440, 360)

# Bottom Left "Storage Shelves"
draw_wall(60, 580, 250, 620)
draw_wall(60, 660, 250, 700)

# Bottom Right "Desks"
draw_wall(450, 580, 520, 620)
draw_wall(600, 580, 680, 620)
draw_wall(450, 680, 520, 720)
draw_wall(600, 680, 680, 720)

# Add an emergency exit feature at the bottom right
# We clear out part of the outer border to simulate a physical exit
cv2.rectangle(img, (780, 650), (800, 750), 255, -1)

# Save the map directly to replace the old one
save_path = os.path.join(os.path.dirname(__file__), 'floor_map_1.png')
cv2.imwrite(save_path, img)
print(f"Complex map generated and saved to {save_path}")
