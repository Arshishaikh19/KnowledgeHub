import { Request, Response } from 'express';
import path from 'path';
import { DocumentModel, IDocument, FileFormat, PermissionRole } from '../models/Document';
import { enqueueParseJob } from '../config/redis';
import { getDbConnectionStatus } from '../config/db';

// Documents store (strictly populated from uploads/database)
let fallbackStore: any[] = [];


/**
 * Task 1: POST /api/documents/upload
 * Accept file, push to blob storage, create Mongo record, enqueue parse job
 */
export async function uploadDocumentController(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    const user = req.user!;
    const title = (req.body.title as string) || file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const department = req.body.department || user.department || 'General';
    const visibility = req.body.visibility || 'company';
    
    let tags: string[] = [];
    if (req.body.tags) {
      try {
        tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      } catch {
        tags = [String(req.body.tags)];
      }
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') as FileFormat;
    const format = ['pdf', 'docx', 'pptx', 'xlsx', 'csv'].includes(ext) ? ext : 'pdf';

    const newVersion = {
      versionId: `ver_${Date.now()}`,
      versionNumber: 1,
      uploadedAt: new Date(),
      uploadedBy: user.name,
      fileSize: file.size,
      fileName: file.originalname,
      storageKey: file.path,
      summary: `Initial upload of ${file.originalname}`,
      chunkCount: 0,
      isCurrent: true,
    };

    const docPayload = {
      title,
      originalFileName: file.originalname,
      fileFormat: format,
      fileSize: file.size,
      storageKey: file.path,
      status: 'processing' as const,
      statusMessage: 'Enqueued to BullMQ background worker for text extraction and vector embedding.',
      department,
      tags: tags.length ? tags : ['Ingested', department],
      currentVersion: 1,
      versions: [newVersion],
      permissions: [
        {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          role: 'admin' as PermissionRole,
        },
      ],
      visibility,
      uploadedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      totalChunks: 0,
      ocrProcessed: false,
    };

    let createdDoc: any;

    if (getDbConnectionStatus()) {
      createdDoc = await DocumentModel.create(docPayload);
    } else {
      createdDoc = {
        ...docPayload,
        _id: `doc_${Date.now()}`,
        id: `doc_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackStore.unshift(createdDoc);
    }

    // Enqueue parse job into BullMQ queue
    await enqueueParseJob({
      documentId: String(createdDoc._id || createdDoc.id),
      filePath: file.path,
      fileFormat: format,
      department,
    });

    return res.status(201).json({
      message: 'Document uploaded and enqueued for parsing.',
      document: createdDoc,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Upload failed: ${errorMsg}` });
  }
}

/**
 * Task 2: GET /api/documents
 * List documents, filtered by what the user has permission to see
 */
export async function getDocumentsController(req: Request, res: Response) {
  try {
    const user = req.user!;
    const { status, department, format, tag, search } = req.query;

    if (getDbConnectionStatus()) {
      // Build compound permission query
      const permissionFilter =
        user.role === 'admin'
          ? {}
          : {
              $or: [
                { 'uploadedBy.email': user.email.toLowerCase() },
                { visibility: 'company' },
                { $and: [{ visibility: 'team' }, { department: user.department }] },
                { 'permissions.userEmail': user.email.toLowerCase() },
              ],
            };

      const queryFilter: any = { ...permissionFilter };

      if (status) queryFilter.status = status;
      if (department && department !== 'all') queryFilter.department = department;
      if (format && format !== 'all') queryFilter.fileFormat = format;
      if (tag && tag !== 'all') queryFilter.tags = tag;
      if (search) {
        queryFilter.$or = [
          { title: { $regex: String(search), $options: 'i' } },
          { originalFileName: { $regex: String(search), $options: 'i' } },
        ];
      }

      const docs = await DocumentModel.find(queryFilter).sort({ updatedAt: -1 });
      return res.json({ documents: docs, count: docs.length });
    }

    // Fallback store
    let filtered = [...fallbackStore];

    if (user.role !== 'admin') {
      filtered = filtered.filter((doc) => {
        if (doc.uploadedBy?.email?.toLowerCase() === user.email.toLowerCase()) return true;
        if (doc.visibility === 'company') return true;
        if (doc.visibility === 'team' && doc.department === user.department) return true;
        if (doc.permissions?.some((p: any) => p.userEmail?.toLowerCase() === user.email.toLowerCase()))
          return true;
        return false;
      });
    }

    if (status) filtered = filtered.filter((d) => d.status === status);
    if (department && department !== 'all') filtered = filtered.filter((d) => d.department === department);
    if (format && format !== 'all') filtered = filtered.filter((d) => d.fileFormat === format);
    if (tag && tag !== 'all') filtered = filtered.filter((d) => d.tags.includes(tag));
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((d) => d.title.toLowerCase().includes(q) || d.originalFileName.toLowerCase().includes(q));
    }

    return res.json({ documents: filtered, count: filtered.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch documents: ${errorMsg}` });
  }
}

/**
 * Task 3: POST /api/documents/:id/share
 * Manage permissions: assign viewer/editor/admin roles & update visibility scope
 */
export async function shareDocumentController(req: Request, res: Response) {
  try {
    const docId = req.params.id;
    const { permissions, visibility } = req.body;
    const user = req.user!;

    if (getDbConnectionStatus()) {
      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      // Check if caller has admin or owner permission to edit sharing
      const isOwner = doc.uploadedBy.email.toLowerCase() === user.email.toLowerCase();
      const isAdmin = user.role === 'admin' || doc.permissions.some(p => p.userEmail.toLowerCase() === user.email.toLowerCase() && p.role === 'admin');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only document owners or admins can modify permissions.' });
      }

      if (permissions) doc.permissions = permissions;
      if (visibility) doc.visibility = visibility;

      await doc.save();
      return res.json({ message: 'Permissions updated successfully.', document: doc });
    }

    // Fallback in-memory update
    const doc = fallbackStore.find((d) => (d._id || d.id) === docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (permissions) doc.permissions = permissions;
    if (visibility) doc.visibility = visibility;
    doc.updatedAt = new Date();

    return res.json({ message: 'Permissions updated successfully.', document: doc });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to update permissions: ${errorMsg}` });
  }
}

/**
 * Task 4: POST /api/documents/:id/reupload
 * New revision uploaded, old version archived, enqueue re-embedding job
 */
export async function reuploadDocumentController(req: Request, res: Response) {
  try {
    const docId = req.params.id;
    const file = req.file;
    const summary = (req.body.summary as string) || '';
    const user = req.user!;

    if (!file) {
      return res.status(400).json({ error: 'No updated document file provided.' });
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') as FileFormat;
    const format = ['pdf', 'docx', 'pptx', 'xlsx', 'csv'].includes(ext) ? ext : 'pdf';

    if (getDbConnectionStatus()) {
      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      // Check editor/admin permission
      const isOwner = doc.uploadedBy.email.toLowerCase() === user.email.toLowerCase();
      const canEdit =
        user.role === 'admin' ||
        isOwner ||
        doc.permissions.some(
          (p) =>
            p.userEmail.toLowerCase() === user.email.toLowerCase() &&
            (p.role === 'editor' || p.role === 'admin')
        );

      if (!canEdit) {
        return res.status(403).json({ error: 'Forbidden: You need Editor permission to upload new revisions.' });
      }

      const nextVersionNumber = doc.currentVersion + 1;

      // 1. Mark existing versions as archived (isCurrent = false)
      doc.versions.forEach((v) => {
        v.isCurrent = false;
      });

      // 2. Push new version
      const newVersionRecord = {
        versionId: `ver_${Date.now()}`,
        versionNumber: nextVersionNumber,
        uploadedAt: new Date(),
        uploadedBy: user.name,
        fileSize: file.size,
        fileName: file.originalname,
        storageKey: file.path,
        summary: summary || `Version ${nextVersionNumber} revision`,
        chunkCount: 0,
        isCurrent: true,
      };

      doc.versions.push(newVersionRecord);
      doc.currentVersion = nextVersionNumber;
      doc.originalFileName = file.originalname;
      doc.fileSize = file.size;
      doc.storageKey = file.path;
      doc.fileFormat = format;
      doc.status = 'processing';
      doc.statusMessage = `Re-indexing version ${nextVersionNumber}.0: purging old chunks and generating fresh embeddings.`;

      await doc.save();

      // 3. Enqueue BullMQ worker parse & re-embed job
      await enqueueParseJob({
        documentId: String(doc._id),
        filePath: file.path,
        fileFormat: format,
        department: doc.department,
      });

      return res.status(200).json({
        message: `Version ${nextVersionNumber}.0 uploaded. Old version archived and re-embedding enqueued.`,
        document: doc,
      });
    }

    // In-memory fallback
    const doc = fallbackStore.find((d) => (d._id || d.id) === docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const nextVer = doc.currentVersion + 1;
    doc.versions.forEach((v: any) => {
      v.isCurrent = false;
    });

    const newVer = {
      versionId: `ver_${Date.now()}`,
      versionNumber: nextVer,
      uploadedAt: new Date(),
      uploadedBy: user.name,
      fileSize: file.size,
      fileName: file.originalname,
      storageKey: file.path,
      summary: summary || `Version ${nextVer} update`,
      chunkCount: 0,
      isCurrent: true,
    };

    doc.versions.push(newVer);
    doc.currentVersion = nextVer;
    doc.originalFileName = file.originalname;
    doc.fileSize = file.size;
    doc.storageKey = file.path;
    doc.fileFormat = format;
    doc.status = 'processing';
    doc.statusMessage = `Re-indexing version ${nextVer}.0: purging old chunks and generating fresh embeddings.`;
    doc.updatedAt = new Date();

    await enqueueParseJob({
      documentId: String(doc._id || doc.id),
      filePath: file.path,
      fileFormat: format,
      department: doc.department,
    });

    return res.status(200).json({
      message: `Version ${nextVer}.0 uploaded. Old version archived and re-embedding enqueued.`,
      document: doc,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Reupload failed: ${errorMsg}` });
  }
}

/**
 * Task 7: POST /api/documents/:id/retry
 * Reset document status to processing, re-enqueue parse & vector job
 */
export async function retryDocumentController(req: Request, res: Response) {
  try {
    const docId = req.params.id;
    const user = req.user!;

    if (getDbConnectionStatus()) {
      const doc = await DocumentModel.findById(docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      // Check permission (owner, admin, or editor)
      const isOwner = doc.uploadedBy.email.toLowerCase() === user.email.toLowerCase();
      const canRetry =
        user.role === 'admin' ||
        isOwner ||
        doc.permissions.some(
          (p) =>
            p.userEmail.toLowerCase() === user.email.toLowerCase() &&
            (p.role === 'editor' || p.role === 'admin')
        );

      if (!canRetry) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to retry this document.' });
      }

      doc.status = 'processing';
      doc.statusMessage = 'Retry initiated: re-running text extraction and vector indexing.';
      await doc.save();

      // Enqueue parse job into BullMQ
      await enqueueParseJob({
        documentId: String(doc._id),
        filePath: doc.storageKey,
        fileFormat: doc.fileFormat,
        department: doc.department,
      });

      return res.status(200).json({
        message: 'Document re-ingestion enqueued successfully.',
        document: doc,
      });
    }

    // In-memory fallback
    const doc = fallbackStore.find((d) => (d._id || d.id) === docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    doc.status = 'processing';
    doc.statusMessage = 'Retry initiated: re-running text extraction and vector indexing.';
    doc.updatedAt = new Date();

    await enqueueParseJob({
      documentId: String(doc._id || doc.id),
      filePath: doc.storageKey,
      fileFormat: doc.fileFormat,
      department: doc.department,
    });

    return res.status(200).json({
      message: 'Document re-ingestion enqueued successfully.',
      document: doc,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Retry failed: ${errorMsg}` });
  }
}


