# Flag Game Design Document
*Private development notes - not for public GitHub repository*

## Game Overview

The flag game is a physics-based mini-game integrated into the Swedish-Finnish translation app. It features a bouncing Swedish flag that players can interact with through various mechanics.

## Core Mechanics

### Flag Physics
- **Movement**: Flag bounces around the screen with realistic physics
- **Speed System**: Base speed multiplied by various factors
- **Collision Detection**: Flag bounces off screen edges and pins
- **Trail Effects**: Visual particle trail follows the flag

### Speed System
- **Base Speed**: Randomized on reset (0.7-1.9x, with rare 2.0x and extreme 100x)
- **Speed Boosts**: Temporary multipliers from flag clicks or green pins
- **RIP Multiplier**: Every 1000 destroyed pins doubles base speed permanently
- **Mobile Adjustment**: 30% speed in mobile portrait mode

### Pin System
- **Red Pins**: Standard obstacles, destroyed after 10 collisions
- **Green Pins**: Indestructible, provide speed boosts when hit
- **Purple Pins**: Mobile boss pins that travel across screen in straight lines
- **Placement**: Drag mouse to create pin trails
- **Removal**: Right-click to remove individual pins

### Warning System
- **Speed Threshold**: Warning appears when speed > 500
- **Reset Reminder**: "R = reset" text shows when speed ≤ 500
- **Passive Damage**: Speed > 1000 damages all pins every 2 seconds
- **Oneshot Mechanic**: Speed > 1000 instantly destroys red pins on collision

### Purple Pin Boss System
- **Size**: 5x larger than standard red pins
- **Movement**: Travels in straight lines across screen with random trajectories
- **Health System**: Visible health bar displayed above the pin
- **Health Points**: Requires multiple flag collisions to destroy
- **Reward**: Drops one green pin when destroyed
- **Spawn Conditions**: Appears when player reaches high RIP counts or extreme speeds
- **Trajectory**: Random entry and exit points on screen edges

## Progression System

### Level 1: Learning the Basics
**Objective**: Understand basic mechanics and controls
- Learn to drop pins with mouse drag
- Practice flag clicking for speed boosts
- Understand the R key reset function
- Get comfortable with pin removal (right-click)

**Success Criteria**: 
- Successfully place and remove pins
- Use R key to reset flag when needed
- Achieve first speed boost from flag clicking

### Level 2: Strategic Pin Placement
**Objective**: Master defensive pin strategies
- Create effective pin barriers
- Learn optimal pin spacing and patterns
- Understand collision mechanics and pin durability
- Practice managing pin count vs. flag speed

**Success Criteria**:
- Maintain 50+ pins on screen simultaneously
- Successfully contain flag in specific screen areas
- Reach 100 RIP points (destroyed pins)

### Level 3: Speed Management
**Objective**: Handle high-speed scenarios
- Learn to manage warning states (speed > 500)
- Practice emergency resets during extreme speeds
- Understand passive damage mechanics
- Master green pin strategic placement

**Success Criteria**:
- Survive speed > 1000 for 30+ seconds
- Strategically use green pins for controlled speed boosts
- Reach 500 RIP points

### Level 4: Advanced Techniques
**Objective**: Master all game mechanics
- Perfect pin dragging and green pin manipulation
- Optimize RIP farming strategies
- Handle extreme speed scenarios (100x multiplier)
- Achieve high RIP scores efficiently
- Encounter and destroy first purple boss pins

**Success Criteria**:
- Reach 1000+ RIP points (unlocks 2x permanent speed multiplier)
- Successfully manage extreme speed events
- Create complex pin formations
- Destroy at least 3 purple boss pins

### Level 5: Mastery
**Objective**: Become a flag game expert
- Consistently handle any speed scenario
- Optimize for maximum RIP generation
- Master all interaction techniques
- Achieve sustainable high-speed gameplay
- Become a purple pin hunting expert

**Success Criteria**:
- Reach 5000+ RIP points
- Maintain control during 100x speed events
- Create and execute advanced pin strategies
- Destroy 10+ purple boss pins in a single session

## Hidden Features & Easter Eggs

### Debug Commands
- **"green" key sequence**: Spawns green pin at score location
- **Title click**: Toggles between word learning and flag game modes
- **Score pin dragging**: When score > 0, drag from score pin to create green pins

### Special Mechanics
- **Speed Boost Stacking**: Green pin boosts extend existing boosts rather than replace
- **RIP Speed Scaling**: Exponential speed increases every 1000 RIP points
- **Extreme Speed Events**: 1% chance for 100x speed on reset
- **Mobile Optimizations**: Automatic mode switching and speed adjustments

## Technical Notes

### Performance Considerations
- Trail particles limited to prevent lag
- Passive damage sparks limited to 3 pins maximum
- Collision detection optimized for smooth gameplay
- Mobile-specific speed reductions for playability

### Balance Adjustments
- Pin collision count: 10 hits to destroy
- Speed boost duration: 3 seconds default
- Passive damage interval: 2 seconds
- Warning threshold: 500 speed units
- Oneshot threshold: 1000 speed units

### Purple Pin Technical Specs
- **Health Points**: 50-100 HP (scales with player RIP level)
- **Movement Speed**: Moderate, allowing skilled players to intercept
- **Spawn Rate**: 1 purple pin every 2000 RIP points, or during extreme speed events
- **Size Multiplier**: 5x standard pin radius
- **Health Bar**: Red bar above pin, depletes with each flag collision
- **Collision Damage**: Flag speed determines damage dealt per hit
- **Drop Location**: Green pin spawns at destruction location

## Development Priorities

1. **Core Stability**: Ensure smooth physics and collision detection
2. **Mobile Experience**: Optimize for touch devices and different orientations
3. **Visual Polish**: Enhance particle effects and visual feedback
4. **Balance Tuning**: Adjust speed curves and difficulty progression
5. **Feature Expansion**: Consider additional pin types or mechanics

---
*This document contains internal game design information and should remain private to the development team.*
