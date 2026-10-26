import { Request, Response, NextFunction } from 'express';
import { DocumentModel } from '../models/Document';
import { PermissionRole } from '../models/Document';

export function checkDocumentPermission(requiredRole: PermissionRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const docId = req.params.id || req.body.documentId;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    // System Admins always pass
    if (user.role === 'admin') {
      return next();
    }

    if (!docId) {
      return res.status(400).json({ error: 'Document ID is required for permission validation.' });
    }

    try {
      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      // Owner always has full access
      if (doc.uploadedBy.email.toLowerCase() === user.email.toLowerCase()) {
        return next();
      }

      // Check explicit permissions array
      const userPerm = doc.permissions.find(
        (p) => p.userEmail.toLowerCase() === user.email.toLowerCase()
      );

      if (userPerm) {
        if (requiredRole === 'viewer') return next();
        if (requiredRole === 'editor' && (userPerm.role === 'editor' || userPerm.role === 'admin'))
          return next();
        if (requiredRole === 'admin' && userPerm.role === 'admin') return next();
      }

      // Check visibility scope
      if (doc.visibility === 'company' && requiredRole === 'viewer') {
        return next();
      }

      if (
        doc.visibility === 'team' &&
        doc.department.toLowerCase() === user.department.toLowerCase() &&
        requiredRole === 'viewer'
      ) {
        return next();
      }

      return res.status(403).json({
        error: `Forbidden: You need "${requiredRole}" permission to perform this action.`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: `Permission verification error: ${errorMsg}` });
    }
  };
}
