const express = require('express');
const pool = require('./dbConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerOptions'); // Import Swagger options
const app = express();

// Middleware
app.use(express.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Secret key for JWT
const JWT_SECRET = 'your_secret_key'; // Change this to a more secure key

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const userResult = await pool.query('SELECT * FROM "Users" WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // Generate a token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Send the token in the response
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).send('Server Error');
  }
});
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
// Get User by ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM "Users" WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new user
app.post('/users', async (req, res) => {
  const { first_name, last_name, email, password, phone_number, shipping_address, billing_address } = req.body;

  try {
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await pool.query(
      `INSERT INTO "Users" (first_name, last_name, email, password, phone_number, shipping_address, billing_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [first_name, last_name, email, hashedPassword, phone_number, shipping_address, billing_address]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Update User by ID
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password, phone_number, shipping_address, billing_address } = req.body;

  try {
    // Hash the password if it is being updated
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE "Users"
       SET first_name = $1, last_name = $2, email = $3, password = COALESCE($4, password), phone_number = $5, shipping_address = $6, billing_address = $7
       WHERE id = $8 RETURNING *`,
      [first_name, last_name, email, hashedPassword, phone_number, shipping_address, billing_address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete User by ID
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM "Users" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone_number:
 *                   type: string
 *                 shipping_address:
 *                   type: string
 *                 billing_address:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

// Create a new product
app.post('/products', async (req, res) => {
  const { name, description, price, stock_quantity, category_id, brand_id } = req.body;

  try {
    const newProduct = await pool.query(
      `INSERT INTO "Products" (name, description, price, stock_quantity, category_id, brand_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, stock_quantity, category_id, brand_id]
    );

    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Read all products
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Products"');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Read a single product by ID
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM "Products" WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/// Update a product by ID
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock_quantity, category_id, brand_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "Products"
       SET name = $1, description = $2, price = $3, stock_quantity = $4, category_id = $5, brand_id = $6
       WHERE id = $7 RETURNING *`,
      [name, description, price, stock_quantity, category_id, brand_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/// Delete a product by ID
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM "Products" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// Create a cart for a user
app.post('/carts', async (req, res) => {
  const { user_id } = req.body;

  try {
    const newCart = await pool.query(
      `INSERT INTO "Carts" (user_id) VALUES ($1) RETURNING *`,
      [user_id]
    );
    res.status(201).json(newCart.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add item to cart
app.post('/carts/:cart_id/items', async (req, res) => {
  const { cart_id } = req.params;
  const { product_id, quantity } = req.body;

  try {
    const newItem = await pool.query(
      `INSERT INTO "CartItems" (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
      [cart_id, product_id, quantity]
    );
    res.status(201).json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all items in a cart
app.get('/carts/:cart_id/items', async (req, res) => {
  const { cart_id } = req.params;

  try {
    const items = await pool.query(
      `SELECT ci.id, p.name, p.price, ci.quantity
       FROM "CartItems" ci
       JOIN "Products" p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart_id]
    );
    res.json(items.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update item quantity in cart
app.put('/carts/:cart_id/items/:item_id', async (req, res) => {
  const { cart_id, item_id } = req.params;
  const { quantity } = req.body;

  try {
    const updatedItem = await pool.query(
      `UPDATE "CartItems" 
       SET quantity = $1
       WHERE id = $2 AND cart_id = $3 RETURNING *`,
      [quantity, item_id, cart_id]
    );

    if (updatedItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json(updatedItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Remove item from cart
app.delete('/carts/:cart_id/items/:item_id', async (req, res) => {
  const { cart_id, item_id } = req.params;

  try {
    const deletedItem = await pool.query(
      `DELETE FROM "CartItems" 
       WHERE id = $1 AND cart_id = $2 RETURNING *`,
      [item_id, cart_id]
    );

    if (deletedItem.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a cart (e.g., after checkout)
app.delete('/carts/:cart_id', async (req, res) => {
  const { cart_id } = req.params;

  try {
    const deletedCart = await pool.query(
      `DELETE FROM "Carts" WHERE id = $1 RETURNING *`,
      [cart_id]
    );

    if (deletedCart.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.json({ message: 'Cart deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Checkout Route
app.post('/checkout', async (req, res) => {
  const { cart_id, user_id } = req.body;

  try {
    // Fetch the cart items for the specified cart
    const cartItemsResult = await pool.query(
      `SELECT ci.quantity, p.price, p.name 
       FROM "CartItems" ci
       JOIN "Products" p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`, 
       [cart_id]
    );

    const cartItems = cartItemsResult.rows;

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate the total amount
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.quantity * item.price;
    });

    // Simulate payment success (In a real-world scenario, this is where payment processing would happen)
    const paymentSuccess = true;

    if (!paymentSuccess) {
      throw new Error('Payment processing failed');
    }

    // Clear the cart items (you can either clear the entire cart or mark it as completed)
    await pool.query('DELETE FROM "CartItems" WHERE cart_id = $1', [cart_id]);

    res.json({
      message: 'Checkout successful',
      totalAmount: totalAmount,
      items: cartItems
    });
  } catch (err) {
    console.error('Error during checkout:', err.message);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Create a new order
app.post('/orders', async (req, res) => {
  const { user_id, total_amount, status } = req.body;

  try {
    const newOrder = await pool.query(
      `INSERT INTO "Orders" (user_id, total_amount, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, total_amount, status]
    );

    res.status(201).json(newOrder.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Read all orders
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Orders"');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Read a single order by ID
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM "Orders" WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update an order by ID
app.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { total_amount, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE "Orders"
       SET total_amount = COALESCE($1, total_amount), status = COALESCE($2, status)
       WHERE id = $3 RETURNING *`,
      [total_amount, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an order by ID
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM "Orders" WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
