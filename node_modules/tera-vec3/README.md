# tera-vec3
3D vector math library optimized for TERA.

## Examples
```js
const Vec3 = require('tera-vec3')

let v = new Vec3(1, 2, 3)
console.log(v) // prints '1,2,3'
v.add({x: 3})
console.log(v) // prints '4,2,3'
```

#### Shorthand cloning:
```js
const Vec3 = require('tera-vec3')

let v1 = new Vec3(1, 2, 3)
let v2 = v1.addN(1, 1, 1)

console.log(v1) // prints '1,2,3'
console.log(v2) // prints '2,3,4'
```

## Constructor
#### `new Vec3(vector)`
Creates a new instance of Vec3. `vector` may be one of the following (all coordinates are optional):
* x, y, z
* [x, y, z]
* {x, y, z}

`undefined` coordinates are replaced with `0`, all other types are coerced using `Number()`.

**Note:** This function *does not* throw errors, and `NaN` is considered a valid value for coordinates.
## Methods
#### The following methods modify the current object and return `this`:
#### `add(vector)`
Adds a vector to this.

#### `sub(vector)`
Subtracts a vector from this.

#### `mult(vector)`
Multiplies coordinates by `vector`. `undefined` coordinates default to `1`.

#### `div(vector)`
Divides coordinates by `vector`. `undefined` coordinates default to `1`.

#### `scale(scalar)`
Multiplies all coordinates by `scalar`.

#### `rotate(radians)`
Rotates this vector around its Z axis by `radians`.

#### `normalize()`
Normalizes this vector, setting its `length()` to `1`.

#### `abs()`
Sets all coordinates to their absolute values.

#### `round()`
Rounds all coordinates to the nearest integer.

#### The following methods return a new `Vec3` instead of modifyng the current object:
#### `addN(vector)`
#### `subN(vector)`
#### `multN(vector)`
#### `divN(vector)`
#### `scaleN(scalar)`
#### `rotateN(radians)`
#### `normalizeN()`
#### `absN()`
#### `roundN()`

#### The following methods *do not* modify the current object:
#### `length()`
Returns the length of this vector.

#### `sqrLength()`
Returns the squared length of this vector. (micro-optimization)

#### `dist2D(vector)`
Returns the distance between two vectors, ignoring Z axis.

#### `sqrDist2D(vector)`
Returns the squared distance between two vectors, ignoring Z axis. (micro-optimization)

#### `dist3D(vector)`
Returns the distance between two vectors.

#### `sqrDist3D(vector)`
Returns the squared distance between two vectors. (micro-optimization)

#### `angleTo(vector)`
Returns the 2D arc tangent from this vector to the specified one, ignoring Z axis.

#### `isNaN()`
Returns a boolean indicating whether one or more coordinates are not a number.

#### `clone()`
Returns a copy of this Vec3.

#### `equals(vector)`
Returns a boolean indicating whether compared coordinates are the same.

#### `toString()`
Returns a string representation of this Vec3.