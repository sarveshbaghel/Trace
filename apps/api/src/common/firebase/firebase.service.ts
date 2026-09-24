import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { App, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: App;
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Startup validation — surface missing credentials immediately
    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error(
        'Firebase credentials missing! Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env. ' +
        `Found: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
      );
      return;
    }

    try {
      if (getApps().length === 0) {
        this.firebaseApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        this.firebaseApp = getApps()[0];
      }
      this.logger.log(`Firebase initialized for project: ${projectId}`);
    } catch (error: any) {
      this.logger.error(`Firebase initialization failed: ${error.message}`, error.stack);
    }
  }

  getAuth(): Auth {
    return getAuth(this.firebaseApp);
  }

  async verifyIdToken(idToken: string) {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return this.getAuth().verifyIdToken(idToken);
  }

  async uploadImage(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (!this.firebaseApp) {
      this.logger.error('Cannot upload image — Firebase not initialized');
      throw new Error('Firebase not initialized');
    }

    const bucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    const bucket = getStorage(this.firebaseApp).bucket(bucketName);
    
    const file = bucket.file(`complaints/${Date.now()}_${filename}`);
    
    await file.save(fileBuffer, {
      metadata: { contentType: mimeType },
    });
    
    await file.makePublic();
    
    return `https://storage.googleapis.com/${bucketName}/${file.name}`;
  }
}