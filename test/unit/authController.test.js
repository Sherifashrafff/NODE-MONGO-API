const authController = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController.register', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { name: 'Alice', email: 'alice@example.com', password: 'secret123' } };
    res = makeRes();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('creates a user and returns 201 with token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: 'uid1', name: 'Alice', email: 'alice@example.com' });
    jwt.sign.mockReturnValue('signed-token');

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      token: 'signed-token',
      user: { id: 'uid1', name: 'Alice', email: 'alice@example.com' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 409 when email is already registered', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-uid' });

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('delegates unexpected errors to the error handler', async () => {
    const dbError = new Error('Connection lost');
    User.findOne.mockRejectedValue(dbError);

    await authController.register(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authController.signToken', () => {
  it('calls jwt.sign with the correct arguments', () => {
    jwt.sign.mockReturnValue('tok');
    authController.signToken('uid1');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'uid1' },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) })
    );
  });
});
