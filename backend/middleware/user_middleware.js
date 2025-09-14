//Middleware to check which user has logged in and whether we are admin to begin with or not.

export function userLoggedIn(req, res, next) {
  if (!req.session.user) return res.status(401).json("Not logged in!");
  console.log("User logged in:", req.session.user.email);
  next();
}

//Middleware to check if user is admin
//Returns 404 if not (to indicate these routes don't even exist for non-admins)
export function userIsAdmin(req, res, next) {
  if (!req.session.user) return res.sendStatus(404);
  if (!req.session.user.isAdmin) return res.sendStatus(404);
  console.log("Admin User logged in:", req.session.user.email);
  next();
}

export function userNotLoggedIn(req, res, next) {
  if (req.session.user) return res.status(401).json("Already logged in!");
  next();
}
